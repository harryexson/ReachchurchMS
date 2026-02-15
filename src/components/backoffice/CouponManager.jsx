import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Copy, AlertCircle, CheckCircle } from "lucide-react";

export default function CouponManager() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        applicable_tiers: ["all"],
        start_date: "",
        expiry_date: "",
        max_redemptions: null,
        max_redemptions_per_customer: 1,
        duration_type: "once",
        duration_months: 1,
        status: "active"
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Coupon.list();
            setCoupons(data);
            setError(null);
        } catch (err) {
            setError("Failed to load coupons");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingCoupon) {
                await base44.entities.Coupon.update(editingCoupon.id, formData);
            } else {
                await base44.entities.Coupon.create(formData);
            }
            setOpenDialog(false);
            setEditingCoupon(null);
            resetForm();
            loadCoupons();
        } catch (err) {
            setError(err.message || "Failed to save coupon");
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData(coupon);
        setOpenDialog(true);
    };

    const handleDelete = async (couponId) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await base44.entities.Coupon.delete(couponId);
            loadCoupons();
        } catch (err) {
            setError("Failed to delete coupon");
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            description: "",
            discount_type: "percentage",
            discount_value: 0,
            applicable_tiers: ["all"],
            start_date: "",
            expiry_date: "",
            max_redemptions: null,
            max_redemptions_per_customer: 1,
            duration_type: "once",
            duration_months: 1,
            status: "active"
        });
    };

    const handleOpenDialog = () => {
        setEditingCoupon(null);
        resetForm();
        setOpenDialog(true);
    };

    const isExpired = (coupon) => {
        if (!coupon.expiry_date) return false;
        return new Date(coupon.expiry_date) < new Date();
    };

    const isReachedLimit = (coupon) => {
        return coupon.max_redemptions && coupon.redeemed_count >= coupon.max_redemptions;
    };

    if (loading) {
        return <div className="p-6 text-center">Loading coupons...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Coupon Management</h2>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder="Coupon Code (e.g., SAVE10)"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                                <Input
                                    placeholder="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    placeholder={formData.discount_type === 'percentage' ? 'Discount %' : 'Discount $'}
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                    min="0"
                                    required
                                />
                                <Input
                                    type="date"
                                    placeholder="Start Date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                                <Input
                                    type="date"
                                    placeholder="Expiry Date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max Redemptions (leave blank for unlimited)"
                                    value={formData.max_redemptions || ""}
                                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value ? parseInt(e.target.value) : null })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max Uses Per Customer"
                                    value={formData.max_redemptions_per_customer}
                                    onChange={(e) => setFormData({ ...formData, max_redemptions_per_customer: parseInt(e.target.value) })}
                                    min="1"
                                />
                                <Select value={formData.duration_type} onValueChange={(value) => setFormData({ ...formData, duration_type: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="once">Once</SelectItem>
                                        <SelectItem value="repeating">Repeating</SelectItem>
                                        <SelectItem value="forever">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.duration_type === 'repeating' && (
                                    <Input
                                        type="number"
                                        placeholder="Months"
                                        value={formData.duration_months}
                                        onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                )}
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    {editingCoupon ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Redeemed</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-semibold">{coupon.code}</TableCell>
                                        <TableCell>
                                            {coupon.discount_type === 'percentage' 
                                                ? `${coupon.discount_value}%` 
                                                : `$${coupon.discount_value}`}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.redeemed_count}/{coupon.max_redemptions || '∞'}
                                        </TableCell>
                                        <TableCell>
                                            {isExpired(coupon) ? (
                                                <span className="text-red-600">Expired</span>
                                            ) : isReachedLimit(coupon) ? (
                                                <span className="text-orange-600">Limit Reached</span>
                                            ) : (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Active
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(coupon)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}