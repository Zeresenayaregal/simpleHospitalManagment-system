# Role Differences in Hospital Management System

This document explains the key differences between **Patient**, **Doctor**, and **Administrator** roles in the system.

## Registration Process

### During Sign Up:
- **All users** can select their role from a dropdown menu:
  - Patient
  - Doctor  
  - Administrator

### During Login:
- If you use an email containing "doctor" (e.g., `doctor@hospital.com`), you'll be automatically assigned the **doctor** role
- If you use an email containing "admin" (e.g., `admin@hospital.com`), you'll be automatically assigned the **admin** role
- Otherwise, you'll be assigned the **patient** role

---

## Feature Access by Role

### 👤 **PATIENT** Role

#### Navigation Menu:
- ✅ Dashboard
- ✅ Appointments
- ✅ Records
- ❌ Patients (NOT accessible)

#### Appointments:
- ✅ **View** their own appointments only
- ✅ **Create** new appointments (must enter doctor name)
- ✅ **Cancel** their own scheduled appointments
- ✅ **Complete** appointments (can mark as completed)

#### Medical Records:
- ✅ **View** their own medical records only
- ❌ **Cannot create** new records
- ❌ **Cannot edit** records
- ❌ **Cannot delete** records

#### Dashboard:
- ✅ View personal statistics (appointments, records)
- ❌ Cannot see patient count
- ✅ View recent appointments
- ✅ Quick actions for appointments and records

---

### 👨‍⚕️ **DOCTOR** Role

#### Navigation Menu:
- ✅ Dashboard
- ✅ Appointments
- ✅ Records
- ✅ **Patients** (accessible)

#### Appointments:
- ✅ **View** appointments assigned to them (filtered by doctor name/ID)
- ✅ **Create** new appointments (must enter patient name)
- ✅ **Complete** appointments (can mark scheduled appointments as completed)
- ✅ **Cancel** appointments

#### Medical Records:
- ✅ **View** all medical records
- ✅ **Create** new medical records (doctor name auto-filled)
- ✅ **Edit** existing records
- ✅ **Delete** records

#### Patients:
- ✅ **View** all patients
- ✅ **Add** new patients
- ✅ **Edit** patient information
- ✅ **Delete** patients
- ✅ View patient statistics (appointments, records per patient)

#### Dashboard:
- ✅ View all statistics (appointments, records, patients)
- ✅ View recent appointments assigned to them
- ✅ Quick actions for all features

---

### 👑 **ADMINISTRATOR** Role

#### Navigation Menu:
- ✅ Dashboard
- ✅ Appointments
- ✅ Records
- ✅ **Patients** (accessible)

#### Appointments:
- ✅ **View** ALL appointments (no filtering)
- ✅ **Create** new appointments (can assign any patient/doctor)
- ✅ **Complete** any appointment
- ✅ **Cancel** any appointment
- ✅ Full control over all appointments

#### Medical Records:
- ✅ **View** ALL medical records
- ✅ **Create** new medical records (can assign any patient/doctor)
- ✅ **Edit** any record
- ✅ **Delete** any record
- ✅ Full control over all records

#### Patients:
- ✅ **View** all patients
- ✅ **Add** new patients
- ✅ **Edit** any patient information
- ✅ **Delete** any patient
- ✅ Full administrative control

#### Dashboard:
- ✅ View all statistics (appointments, records, patients)
- ✅ View all recent appointments
- ✅ Full system overview
- ✅ Quick actions for all features

---

## Key Differences Summary

| Feature | Patient | Doctor | Admin |
|---------|---------|--------|-------|
| **View Own Appointments** | ✅ | ✅ | ✅ |
| **View All Appointments** | ❌ | ❌ (only assigned) | ✅ |
| **Create Appointments** | ✅ (must enter doctor) | ✅ (must enter patient) | ✅ (full control) |
| **Complete Appointments** | ✅ | ✅ | ✅ |
| **View Own Records** | ✅ | ✅ | ✅ |
| **View All Records** | ❌ | ✅ | ✅ |
| **Create Records** | ❌ | ✅ | ✅ |
| **Edit/Delete Records** | ❌ | ✅ | ✅ |
| **Access Patients Page** | ❌ | ✅ | ✅ |
| **Manage Patients** | ❌ | ✅ | ✅ |
| **View Patient Stats** | ❌ | ✅ | ✅ |

---

## Visual Indicators

- **Role Badge**: Your role is displayed in the top navigation bar (e.g., "patient", "doctor", "admin")
- **Navigation**: The "Patients" link only appears for doctors and admins
- **Buttons**: Create/Edit/Delete buttons are conditionally shown based on your role
- **Data Filtering**: Each role sees only the data they're authorized to access

---

## Security Notes

- Routes are protected by role-based access control
- Patients cannot access the `/patients` route
- Data is automatically filtered based on user role
- All actions are logged and can be tracked by role

