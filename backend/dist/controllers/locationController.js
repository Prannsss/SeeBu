"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationController = void 0;
const db_1 = require("../config/db");
exports.locationController = {
    async getLocations(req, res) {
        try {
            // Fetch municipalities and their nested barangays
            const { data: municipalities, error } = await db_1.supabase
                .from('municipalities')
                .select(`
          id,
          name,
          barangays (
            id,
            name
          )
        `)
                .order('name');
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.status(200).json({ data: municipalities });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
};
