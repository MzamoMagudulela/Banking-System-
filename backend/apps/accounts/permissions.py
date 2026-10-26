from rest_framework import permissions

class IsStaffUser(permissions.BasePermission):
    """Allows access only to Bank Staff or Administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_bank_staff())

class IsAdminUser(permissions.BasePermission):
    """Allows access only to Administrators."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_administrator())

class IsCustomerUser(permissions.BasePermission):
    """Allows access only to Customers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_customer())

class IsOwnerOrStaff(permissions.BasePermission):
    """Object-level permission to only allow owners of an object or staff to view/edit it."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_bank_staff():
            return True
        user_field = getattr(obj, 'user', None) or getattr(obj, 'creator', None)
        return user_field == request.user
