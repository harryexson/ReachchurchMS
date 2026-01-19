import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Users, Plus, Edit, Trash2, Calendar, DollarSign, 
    Award, Briefcase, UserPlus, FileText, TrendingUp, Search
} from 'lucide-react';

export default function HRManagement() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');

    const [employeeForm, setEmployeeForm] = useState({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: 'engineering',
        position: '',
        employment_type: 'full_time',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        salary: 0,
        pay_frequency: 'biweekly',
        manager_id: '',
        manager_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        vacation_days_total: 15,
        vacation_days_used: 0,
        sick_days_total: 10,
        sick_days_used: 0,
        benefits_enrolled: [],
        notes: ''
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await base44.entities.Employee.list('-hire_date');
            setEmployees(data);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmployee = async () => {
        try {
            if (editingEmployee) {
                await base44.entities.Employee.update(editingEmployee.id, employeeForm);
            } else {
                await base44.entities.Employee.create(employeeForm);
            }
            await loadEmployees();
            setShowEmployeeModal(false);
            setEditingEmployee(null);
            resetForm();
            alert('Employee saved successfully!');
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Failed to save employee');
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        
        try {
            await base44.entities.Employee.delete(id);
            await loadEmployees();
            alert('Employee deleted');
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee');
        }
    };

    const resetForm = () => {
        setEmployeeForm({
            employee_id: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            department: 'engineering',
            position: '',
            employment_type: 'full_time',
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active',
            salary: 0,
            pay_frequency: 'biweekly',
            manager_id: '',
            manager_name: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            emergency_contact_relationship: '',
            vacation_days_total: 15,
            vacation_days_used: 0,
            sick_days_total: 10,
            sick_days_used: 0,
            benefits_enrolled: [],
            notes: ''
        });
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = 
            emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
        
        return matchesSearch && matchesDepartment;
    });

    const activeEmployees = employees.filter(e => e.status === 'active');
    const departmentCounts = employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active</p>
                                <p className="text-2xl font-bold">{activeEmployees.length}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Departments</p>
                                <p className="text-2xl font-bold">{Object.keys(departmentCounts).length}</p>
                            </div>
                            <Briefcase className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">New (This Month)</p>
                                <p className="text-2xl font-bold">
                                    {employees.filter(e => {
                                        const hireDate = new Date(e.hire_date);
                                        const now = new Date();
                                        return hireDate.getMonth() === now.getMonth() && 
                                               hireDate.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
                            </div>
                            <UserPlus className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Employee Directory
                    </CardTitle>
                    <Button onClick={() => {
                        resetForm();
                        setEditingEmployee(null);
                        setShowEmployeeModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                <SelectItem value="engineering">Engineering</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="customer_success">Customer Success</SelectItem>
                                <SelectItem value="operations">Operations</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                                <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Employee Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Hire Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-semibold">{emp.first_name} {emp.last_name}</p>
                                            <p className="text-sm text-slate-500">{emp.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{emp.department.replace('_', ' ')}</TableCell>
                                    <TableCell>{emp.position}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {emp.employment_type.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(emp.hire_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                                            {emp.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEmployeeForm(emp);
                                                    setEditingEmployee(emp);
                                                    setShowEmployeeModal(true);
                                                }}
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Employee Modal */}
            <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit' : 'Add'} Employee</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="basic">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="employment">Employment</TabsTrigger>
                            <TabsTrigger value="contact">Contact</TabsTrigger>
                            <TabsTrigger value="benefits">Benefits</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Employee ID *</Label>
                                    <Input
                                        value={employeeForm.employee_id}
                                        onChange={(e) => setEmployeeForm({...employeeForm, employee_id: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={employeeForm.email}
                                        onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>First Name *</Label>
                                    <Input
                                        value={employeeForm.first_name}
                                        onChange={(e) => setEmployeeForm({...employeeForm, first_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Last Name *</Label>
                                    <Input
                                        value={employeeForm.last_name}
                                        onChange={(e) => setEmployeeForm({...employeeForm, last_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={employeeForm.phone}
                                        onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="employment" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Department *</Label>
                                    <Select
                                        value={employeeForm.department}
                                        onValueChange={(value) => setEmployeeForm({...employeeForm, department: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="engineering">Engineering</SelectItem>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="customer_success">Customer Success</SelectItem>
                                            <SelectItem value="operations">Operations</SelectItem>
                                            <SelectItem value="finance">Finance</SelectItem>
                                            <SelectItem value="hr">HR</SelectItem>
                                            <SelectItem value="executive">Executive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Position *</Label>
                                    <Input
                                        value={employeeForm.position}
                                        onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Employment Type</Label>
                                    <Select
                                        value={employeeForm.employment_type}
                                        onValueChange={(value) => setEmployeeForm({...employeeForm, employment_type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_time">Full Time</SelectItem>
                                            <SelectItem value="part_time">Part Time</SelectItem>
                                            <SelectItem value="contractor">Contractor</SelectItem>
                                            <SelectItem value="intern">Intern</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Hire Date *</Label>
                                    <Input
                                        type="date"
                                        value={employeeForm.hire_date}
                                        onChange={(e) => setEmployeeForm({...employeeForm, hire_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Salary</Label>
                                    <Input
                                        type="number"
                                        value={employeeForm.salary}
                                        onChange={(e) => setEmployeeForm({...employeeForm, salary: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <Label>Pay Frequency</Label>
                                    <Select
                                        value={employeeForm.pay_frequency}
                                        onValueChange={(value) => setEmployeeForm({...employeeForm, pay_frequency: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={employeeForm.status}
                                        onValueChange={(value) => setEmployeeForm({...employeeForm, status: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="on_leave">On Leave</SelectItem>
                                            <SelectItem value="terminated">Terminated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="contact" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={employeeForm.address}
                                        onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        value={employeeForm.city}
                                        onChange={(e) => setEmployeeForm({...employeeForm, city: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        value={employeeForm.state}
                                        onChange={(e) => setEmployeeForm({...employeeForm, state: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={employeeForm.zip_code}
                                        onChange={(e) => setEmployeeForm({...employeeForm, zip_code: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="font-semibold mb-4">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={employeeForm.emergency_contact_name}
                                            onChange={(e) => setEmployeeForm({...employeeForm, emergency_contact_name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={employeeForm.emergency_contact_phone}
                                            onChange={(e) => setEmployeeForm({...employeeForm, emergency_contact_phone: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Relationship</Label>
                                        <Input
                                            value={employeeForm.emergency_contact_relationship}
                                            onChange={(e) => setEmployeeForm({...employeeForm, emergency_contact_relationship: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="benefits" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Vacation Days (Total)</Label>
                                    <Input
                                        type="number"
                                        value={employeeForm.vacation_days_total}
                                        onChange={(e) => setEmployeeForm({...employeeForm, vacation_days_total: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <Label>Vacation Days (Used)</Label>
                                    <Input
                                        type="number"
                                        value={employeeForm.vacation_days_used}
                                        onChange={(e) => setEmployeeForm({...employeeForm, vacation_days_used: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <Label>Sick Days (Total)</Label>
                                    <Input
                                        type="number"
                                        value={employeeForm.sick_days_total}
                                        onChange={(e) => setEmployeeForm({...employeeForm, sick_days_total: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <Label>Sick Days (Used)</Label>
                                    <Input
                                        type="number"
                                        value={employeeForm.sick_days_used}
                                        onChange={(e) => setEmployeeForm({...employeeForm, sick_days_used: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    value={employeeForm.notes}
                                    onChange={(e) => setEmployeeForm({...employeeForm, notes: e.target.value})}
                                    rows={4}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveEmployee}>Save Employee</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}