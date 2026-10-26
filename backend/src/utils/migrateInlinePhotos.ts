import sharp from 'sharp';
import { supabase } from '../config/db';
import { persistImageInput } from './mediaStorage';
import { invalidateWorkflowCaches } from './cache';

/**
 * ONE-TIME MIGRATION (safe to delete once the log reports nothing left to migrate):
 * early report photos were saved as base64 data URLs in report_photos.photo_url, which made
 * every report list download megabytes. Moves each one into Storage — same bucket and folders
 * as new uploads — and swaps the row to the public URL. Idempotent: only touches rows still
 * holding a data URL, so re-running on every boot is a cheap no-op afterwards.
 */
export async function migrateInlinePhotos(): Promise<void> {
  const { data: rows, error } = await supabase
    .from('report_photos')
    .select('id, report_id, is_completion_photo')
    .like('photo_url', 'data:%');
  if (error) throw error;
  if (!rows?.length) return;

  console.log(`[migrateInlinePhotos] migrating ${rows.length} inline photo(s) to Storage`);
  let migrated = 0;

  // One at a time: each row is fetched on its own so a low-memory instance never holds them all.
  for (const row of rows) {
    try {
      const { data: photo, error: fetchError } = await supabase
        .from('report_photos')
        .select('photo_url')
        .eq('id', row.id)
        .single();
      if (fetchError) throw fetchError;

      let input: string = photo.photo_url;
      // SVG is refused by persistImageInput (script risk), so rasterize it — the stored file is a plain WebP.
      const svg = input.match(/^data:image\/svg\+xml;base64,(.+)$/);
      if (svg) {
        const raster = await sharp(Buffer.from(svg[1], 'base64'), { limitInputPixels: 100_000_000 })
          .webp({ quality: 80 })
          .toBuffer();
        input = `data:image/webp;base64,${raster.toString('base64')}`;
      }

      const folder = `reports/${row.report_id}/${row.is_completion_photo ? 'completion' : 'initial'}`;
      const publicUrl = await persistImageInput(input, folder);

      // Guarded so a concurrent run can't overwrite a row that was already migrated.
      const { error: updateError } = await supabase
        .from('report_photos')
        .update({ photo_url: publicUrl })
        .eq('id', row.id)
        .like('photo_url', 'data:%');
      if (updateError) throw updateError;
      migrated++;
    } catch (err: any) {
      console.error(`[migrateInlinePhotos] photo ${row.id} (report ${row.report_id}) failed:`, err?.message || err);
    }
  }

  console.log(`[migrateInlinePhotos] done: ${migrated}/${rows.length} migrated`);
  if (migrated) await invalidateWorkflowCaches();
}
