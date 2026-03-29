"use client"

import { useState } from "react"
import { Users, Filter, Search, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const MOCK_USERS = [
  { id: "1", name: "Juan Dela Cruz", role: "ADMIN", area: "Cebu City", email: "juan@cebucity.gov.ph", status: "Active" },
  { id: "2", name: "Maria Clara", role: "SUPERADMIN", area: "Global", email: "maria@seebu.ph", status: "Active" },
  { id: "3", name: "Pedro Penduko", role: "WORKFORCE_ADMIN", area: "Mandaue City", email: "pedro@mandaue.gov.ph", status: "Active" },
  { id: "4", name: "Andres Bonifacio", role: "WORKFORCE_OFFICER", area: "Cebu City", email: "andres@cebucity.gov.ph", status: "Active" },
  { id: "5", name: "Gabriela Silang", role: "CLIENT", area: "Lapu-Lapu City", email: "gabi@gmail.com", status: "Active" },
  { id: "6", name: "Apolinario Mabini", role: "ADMIN", area: "Talisay City", email: "apolinario@talisay.gov.ph", status: "Pending" },
]

export default function SuperadminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [areaFilter, setAreaFilter] = useState("ALL")

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesArea = areaFilter === "ALL" || user.area === areaFilter
    return matchesSearch && matchesRole && matchesArea
  })

  // Helper method for badge styles
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200'
      case 'ADMIN': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200'
      case 'WORKFORCE_ADMIN': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border-indigo-200'
      case 'WORKFORCE_OFFICER': return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-6xl px-5 pt-10 pb-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Directory</h1>
              <p className="text-muted-foreground">Manage and filter all users across the platform.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or email..." 
                className="pl-9 bg-white dark:bg-slate-950" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-slate-950">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="WORKFORCE_ADMIN">Workforce Admin</SelectItem>
                  <SelectItem value="WORKFORCE_OFFICER">Workforce Officer</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-slate-950">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Area" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-[100]">
                  <SelectItem value="ALL">All Areas</SelectItem>
                  <SelectItem value="Global">Global</SelectItem>
                  <SelectItem value="Cebu City">Cebu City</SelectItem>
                  <SelectItem value="Mandaue City">Mandaue City</SelectItem>
                  <SelectItem value="Lapu-Lapu City">Lapu-Lapu City</SelectItem>
                  <SelectItem value="Talisay City">Talisay City</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Area</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="md:hidden w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found matching the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.area}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={getStatusBadgeClass(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      
                      {/* Mobile Expand Action */}
                      <TableCell className="md:hidden text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-[1rem] p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <DialogHeader>
                              <DialogTitle className="text-xl">User Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Name</p>
                                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</p>
                                <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</p>
                                <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                                  {user.role}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Area</p>
                                <p className="font-medium text-slate-900 dark:text-white">{user.area}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                <Badge variant="secondary" className={getStatusBadgeClass(user.status)}>
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
