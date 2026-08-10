# Detailed API Endpoints

This document provides detailed information about each API endpoint, including its request payload and response structure.

## AppointmentController

### PUT /api/v1/appointments/{appointmentId}/reschedule
**Description**: Reschedule Appointment

**Request Body** (`AppointmentRescheduleRequestDto`):
```json
{
  "appointmentDate": "string",
  "startTime": "string",
  "endTime": "string",
  "reason": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "appointmentDate": "string",
    "startTime": "string",
    "endTime": "string",
    "sourceChannel": "string (ENUM)",
    "status": "string (ENUM)",
    "tokenNumber": 0,
    "reason": "string",
    "notes": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/appointments/{appointmentId}
**Description**: Get Appointment By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "appointmentDate": "string",
    "startTime": "string",
    "endTime": "string",
    "sourceChannel": "string (ENUM)",
    "status": "string (ENUM)",
    "tokenNumber": 0,
    "reason": "string",
    "notes": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/appointments
**Description**: Create Appointment

**Request Body** (`AppointmentRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "doctorId": "string",
  "ownerId": "string",
  "petId": "string",
  "appointmentDate": "string",
  "startTime": "string",
  "endTime": "string",
  "sourceChannel": "string (ENUM)",
  "reason": "string",
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "appointmentDate": "string",
    "startTime": "string",
    "endTime": "string",
    "sourceChannel": "string (ENUM)",
    "status": "string (ENUM)",
    "tokenNumber": 0,
    "reason": "string",
    "notes": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/appointments/{appointmentId}
**Description**: Update Appointment

**Request Body** (`AppointmentRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "doctorId": "string",
  "ownerId": "string",
  "petId": "string",
  "appointmentDate": "string",
  "startTime": "string",
  "endTime": "string",
  "sourceChannel": "string (ENUM)",
  "reason": "string",
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "appointmentDate": "string",
    "startTime": "string",
    "endTime": "string",
    "sourceChannel": "string (ENUM)",
    "status": "string (ENUM)",
    "tokenNumber": 0,
    "reason": "string",
    "notes": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/appointments/{appointmentId}/cancel
**Description**: Cancel Appointment

**Request Body** (`AppointmentCancelRequestDto`):
```json
{
  "cancellationReason": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/appointments/search
**Description**: Search Appointments

**Request Body** (`AppointmentSearchRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "doctorId": "string",
  "ownerId": "string",
  "petId": "string",
  "fromDate": "string",
  "toDate": "string",
  "status": "string (ENUM)",
  "appointmentNumber": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "appointmentNumber": "string",
      "hospitalName": "string",
      "branchName": "string",
      "doctorName": "string",
      "ownerName": "string",
      "petName": "string",
      "appointmentDate": "string",
      "startTime": "string",
      "endTime": "string",
      "sourceChannel": "string (ENUM)",
      "status": "string (ENUM)",
      "tokenNumber": 0,
      "reason": "string",
      "notes": "string"
    }
  ],
  "timestamp": "string"
}
```

---

## AuthController

### POST /api/auth/reset-password
**Description**: Reset Password

**Request Body** (`ResetPasswordRequest`):
```json
{
  "email": "string",
  "otp": "string",
  "newPassword": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### POST /api/auth/change-password
**Description**: Change Password

**Request Body** (`ChangePasswordRequest`):
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "otp": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### GET /api/auth/me
**Description**: Get Current User

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "hospitalId": "string",
    "roles": [
      "string"
    ]
  },
  "timestamp": "string"
}
```

---

### POST /api/auth/forgot-password
**Description**: Forgot Password

**Request Body** (`ForgotPasswordRequest`):
```json
{
  "email": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### POST /api/auth/verify-email
**Description**: Verify Email

**Request Body** (`VerifyEmailRequest`):
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### POST /api/auth/login
**Description**: Login

**Request Body** (`LoginRequest`):
```json
{
  "email": "string",
  "password": "string",
  "deviceInfo": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "string",
    "expiresIn": 0,
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "hospitalId": "string",
      "roles": [
        "string"
      ]
    }
  },
  "timestamp": "string"
}
```

---

### POST /api/auth/refresh
**Description**: Refresh

**Request Body** (`RefreshTokenRequest`):
```json
{
  "refreshToken": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "string",
    "expiresIn": 0,
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "hospitalId": "string",
      "roles": [
        "string"
      ]
    }
  },
  "timestamp": "string"
}
```

---

### POST /api/auth/logout
**Description**: Logout

**Request Body** (`RefreshTokenRequest`):
```json
{
  "refreshToken": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### POST /api/auth/request-password-change-otp
**Description**: Request Password Change Otp

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

### POST /api/auth/resend-verification-otp
**Description**: Resend Verification Otp

**Request Body** (`ForgotPasswordRequest`):
```json
{
  "email": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "object",
  "timestamp": "string"
}
```

---

## BillingController

### PUT /api/v1/billing/invoices/{id}
**Description**: Update Invoice

**Request Body** (`InvoiceUpdateRequest`):
```json
{
  "visitId": "string",
  "items": [
    {
      "itemType": "string (ENUM)",
      "description": "string",
      "quantity": 0,
      "unitPrice": 0,
      "taxRate": 0
    }
  ],
  "discount": 0,
  "isInterState": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "invoiceNumber": "string",
    "patientId": "string",
    "visitId": "string",
    "invoiceDate": "string",
    "subtotal": 0,
    "cgst": 0,
    "sgst": 0,
    "igst": 0,
    "discount": 0,
    "grandTotal": 0,
    "status": "string (ENUM)",
    "dueDate": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/billing/invoices/{id}/cancel
**Description**: Cancel Invoice

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "invoiceNumber": "string",
    "patientId": "string",
    "visitId": "string",
    "invoiceDate": "string",
    "subtotal": 0,
    "cgst": 0,
    "sgst": 0,
    "igst": 0,
    "discount": 0,
    "grandTotal": 0,
    "status": "string (ENUM)",
    "dueDate": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/billing/gst/report
**Description**: Get Gst Report

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "startDate": "string",
    "endDate": "string",
    "totalInvoices": 0,
    "totalSubtotal": 0,
    "totalCgst": 0,
    "totalSgst": 0,
    "totalIgst": 0,
    "totalDiscount": 0,
    "totalGrandTotal": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/billing/invoices
**Description**: List Invoices

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {

  },
  "timestamp": "string"
}
```

---

### GET /api/v1/billing/invoices/{id}
**Description**: Get Invoice By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "invoiceNumber": "string",
    "patientId": "string",
    "visitId": "string",
    "invoiceDate": "string",
    "subtotal": 0,
    "cgst": 0,
    "sgst": 0,
    "igst": 0,
    "discount": 0,
    "grandTotal": 0,
    "status": "string (ENUM)",
    "dueDate": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/billing/invoices
**Description**: Create Invoice

**Request Body** (`InvoiceCreateRequest`):
```json
{
  "patientId": "string",
  "hospitalId": "string",
  "visitId": "string",
  "items": [
    {
      "itemType": "string (ENUM)",
      "description": "string",
      "quantity": 0,
      "unitPrice": 0,
      "taxRate": 0
    }
  ],
  "discount": 0,
  "isInterState": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "invoiceNumber": "string",
    "patientId": "string",
    "visitId": "string",
    "invoiceDate": "string",
    "subtotal": 0,
    "cgst": 0,
    "sgst": 0,
    "igst": 0,
    "discount": 0,
    "grandTotal": 0,
    "status": "string (ENUM)",
    "dueDate": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/billing/invoices/{id}/download
**Description**: Download Invoice Pdf

**Response** (`byte[]`):
```json
[
  {

  }
]
```

---

## BranchController

### GET /api/v1/branches/hospital/{hospitalId}
**Description**: Get Branches By Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "branchName": "string",
      "branchCode": "string",
      "email": "string",
      "phone": "string",
      "addressLine1": "string",
      "stateId": "string",
      "stateName": "string",
      "cityId": "string",
      "cityName": "string",
      "pincode": "string",
      "country": "string",
      "latitude": 0,
      "longitude": 0,
      "isHeadBranch": true,
      "status": "string (ENUM)",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/branches/{branchId}
**Description**: Get Branch

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchName": "string",
    "branchCode": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "stateId": "string",
    "stateName": "string",
    "cityId": "string",
    "cityName": "string",
    "pincode": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0,
    "isHeadBranch": true,
    "status": "string (ENUM)",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/branches/{branchId}
**Description**: Update Branch

**Request Body** (`BranchRequestDto`):
```json
{
  "hospitalId": "string",
  "branchName": "string",
  "branchCode": "string",
  "email": "string",
  "phone": "string",
  "addressLine1": "string",
  "stateId": "string",
  "cityId": "string",
  "pincode": "string",
  "country": "string",
  "latitude": 0,
  "longitude": 0,
  "isHeadBranch": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchName": "string",
    "branchCode": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "stateId": "string",
    "stateName": "string",
    "cityId": "string",
    "cityName": "string",
    "pincode": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0,
    "isHeadBranch": true,
    "status": "string (ENUM)",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/branches
**Description**: Get All Branches

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "branchName": "string",
      "branchCode": "string",
      "email": "string",
      "phone": "string",
      "addressLine1": "string",
      "stateId": "string",
      "stateName": "string",
      "cityId": "string",
      "cityName": "string",
      "pincode": "string",
      "country": "string",
      "latitude": 0,
      "longitude": 0,
      "isHeadBranch": true,
      "status": "string (ENUM)",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/branches
**Description**: Create Branch

**Request Body** (`BranchRequestDto`):
```json
{
  "hospitalId": "string",
  "branchName": "string",
  "branchCode": "string",
  "email": "string",
  "phone": "string",
  "addressLine1": "string",
  "stateId": "string",
  "cityId": "string",
  "pincode": "string",
  "country": "string",
  "latitude": 0,
  "longitude": 0,
  "isHeadBranch": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchName": "string",
    "branchCode": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "stateId": "string",
    "stateName": "string",
    "cityId": "string",
    "cityName": "string",
    "pincode": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0,
    "isHeadBranch": true,
    "status": "string (ENUM)",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/branches/search
**Description**: Search Branches

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {

  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/branches/{branchId}
**Description**: Delete Branch

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## BranchProfileController

### PUT /api/v1/branch-profile/{branchId}
**Description**: Update Branch Profile

**Request Body** (`BranchProfileRequestDto`):
```json
{
  "branchName": "string",
  "email": "string",
  "phone": "string",
  "addressLine1": "string",
  "stateId": "string",
  "cityId": "string",
  "pincode": "string",
  "country": "string",
  "latitude": 0,
  "longitude": 0,
  "isHeadBranch": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "branchId": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchName": "string",
    "branchCode": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "stateId": "string",
    "stateName": "string",
    "cityId": "string",
    "cityName": "string",
    "pincode": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0,
    "isHeadBranch": true,
    "status": "string (ENUM)",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/branch-profile/{branchId}
**Description**: Get Branch Profile

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "branchId": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchName": "string",
    "branchCode": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "stateId": "string",
    "stateName": "string",
    "cityId": "string",
    "cityName": "string",
    "pincode": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0,
    "isHeadBranch": true,
    "status": "string (ENUM)",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## BranchSettingsController

### GET /api/v1/branches/settings/{branchId}
**Description**: Get Settings

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "branchId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/branches/settings/{branchId}
**Description**: Create Settings

**Request Body** (`BranchSettingsRequestDto`):
```json
{
  "openingTime": "string",
  "closingTime": "string",
  "appointmentSlotDuration": 0,
  "maxAdvanceBookingDays": 0,
  "currency": "string",
  "timezone": "string",
  "paymentModes": "string",
  "gstRate": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "branchId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/branches/settings/{branchId}
**Description**: Update Settings

**Request Body** (`BranchSettingsRequestDto`):
```json
{
  "openingTime": "string",
  "closingTime": "string",
  "appointmentSlotDuration": 0,
  "maxAdvanceBookingDays": 0,
  "currency": "string",
  "timezone": "string",
  "paymentModes": "string",
  "gstRate": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "branchId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## FileUploadController

### POST /api/v1/files/upload
**Description**: Upload Image

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "fileName": "string",
    "fileUrl": "string"
  },
  "timestamp": "string"
}
```

---

## ConsultationController

### GET /v1/consultations
**Description**: Get All Consultations

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "appointmentId": "string",
      "doctorId": "string",
      "doctorName": "string",
      "petId": "string",
      "petName": "string",
      "subjective": "string",
      "objective": "string",
      "assessment": "string",
      "plan": "string",
      "followUpDate": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/consultations/doctor/{doctorId}
**Description**: Get Consultations By Doctor

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "appointmentId": "string",
      "doctorId": "string",
      "doctorName": "string",
      "petId": "string",
      "petName": "string",
      "subjective": "string",
      "objective": "string",
      "assessment": "string",
      "plan": "string",
      "followUpDate": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/consultations/pet/{petId}
**Description**: Get Consultations By Pet

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "appointmentId": "string",
      "doctorId": "string",
      "doctorName": "string",
      "petId": "string",
      "petName": "string",
      "subjective": "string",
      "objective": "string",
      "assessment": "string",
      "plan": "string",
      "followUpDate": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/consultations/{consultationId}
**Description**: Get Consultation By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "doctorId": "string",
    "doctorName": "string",
    "petId": "string",
    "petName": "string",
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string",
    "followUpDate": "string"
  },
  "timestamp": "string"
}
```

---

### POST /v1/consultations
**Description**: Add Consultation

**Request Body** (`AddConsultationRequest`):
```json
{
  "appointmentId": "string",
  "doctorId": "string",
  "petId": "string",
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "followUpDate": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "doctorId": "string",
    "doctorName": "string",
    "petId": "string",
    "petName": "string",
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string",
    "followUpDate": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/consultations/{consultationId}
**Description**: Delete Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### PUT /v1/consultations/{consultationId}
**Description**: Update Consultation

**Request Body** (`UpdateConsultationRequest`):
```json
{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "followUpDate": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "doctorId": "string",
    "doctorName": "string",
    "petId": "string",
    "petName": "string",
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string",
    "followUpDate": "string"
  },
  "timestamp": "string"
}
```

---

## DiagnosisController

### GET /v1/diagnosis/consultation/{consultationId}
**Description**: Get Diagnoses By Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "diagnosisName": "string",
      "description": "string",
      "severity": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /v1/diagnosis
**Description**: Add Diagnosis

**Request Body** (`AddDiagnosisRequest`):
```json
{
  "consultationId": "string",
  "diagnosisName": "string",
  "description": "string",
  "severity": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "diagnosisName": "string",
    "description": "string",
    "severity": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/diagnosis/{diagnosisId}
**Description**: Get Diagnosis By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "diagnosisName": "string",
    "description": "string",
    "severity": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/diagnosis
**Description**: Get All Diagnoses

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "diagnosisName": "string",
      "description": "string",
      "severity": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PUT /v1/diagnosis/{diagnosisId}
**Description**: Update Diagnosis

**Request Body** (`UpdateDiagnosisRequest`):
```json
{
  "diagnosisName": "string",
  "description": "string",
  "severity": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "diagnosisName": "string",
    "description": "string",
    "severity": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/diagnosis/{diagnosisId}
**Description**: Delete Diagnosis

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## TreatmentPlanController

### PUT /v1/treatment-plans/{treatmentPlanId}
**Description**: Update Treatment Plan

**Request Body** (`UpdateTreatmentPlanRequest`):
```json
{
  "treatment": "string",
  "medication": "string",
  "dosage": "string",
  "instructions": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "treatment": "string",
    "medication": "string",
    "dosage": "string",
    "instructions": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/treatment-plans/{treatmentPlanId}
**Description**: Get Treatment Plan By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "treatment": "string",
    "medication": "string",
    "dosage": "string",
    "instructions": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/treatment-plans/{treatmentPlanId}
**Description**: Delete Treatment Plan

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /v1/treatment-plans
**Description**: Get All Treatment Plans

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "treatment": "string",
      "medication": "string",
      "dosage": "string",
      "instructions": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/treatment-plans/consultation/{consultationId}
**Description**: Get Treatment Plans By Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "treatment": "string",
      "medication": "string",
      "dosage": "string",
      "instructions": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /v1/treatment-plans
**Description**: Add Treatment Plan

**Request Body** (`AddTreatmentPlanRequest`):
```json
{
  "consultationId": "string",
  "treatment": "string",
  "medication": "string",
  "dosage": "string",
  "instructions": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "treatment": "string",
    "medication": "string",
    "dosage": "string",
    "instructions": "string"
  },
  "timestamp": "string"
}
```

---

## DashboardController

### GET /api/v1/dashboard/appointments
**Description**: Get Appointment Dashboard

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "totalAppointments": 0,
    "todayAppointments": 0,
    "scheduledAppointments": 0,
    "completedAppointments": 0,
    "cancelledAppointments": 0,
    "upcomingAppointments": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/dashboard/daily-summary
**Description**: Get Daily Summary

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "todayAppointments": 0,
    "todayAdmissions": 0,
    "todayDischarges": 0,
    "presentStaffToday": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/dashboard/monthly-summary
**Description**: Get Monthly Summary

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "monthlyAppointments": 0,
    "monthlyAdmissions": 0,
    "monthlyDischarges": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/dashboard/admin
**Description**: Get Admin Dashboard

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "totalHospitals": 0,
    "totalBranches": 0,
    "totalStaff": 0,
    "totalDoctors": 0,
    "totalPetOwners": 0,
    "totalPets": 0,
    "totalAppointments": 0,
    "totalAdmissions": 0,
    "activeAdmissions": 0,
    "availableBeds": 0,
    "occupiedBeds": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/dashboard/staff
**Description**: Get Staff Dashboard

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "totalStaff": 0,
    "activeStaff": 0,
    "inactiveStaff": 0,
    "totalDoctors": 0,
    "presentToday": 0,
    "absentToday": 0,
    "onLeaveToday": 0,
    "pendingLeaveRequests": 0,
    "approvedLeaveRequests": 0
  },
  "timestamp": "string"
}
```

---

## DoctorController

### GET /v1/doctors/{doctorId}
**Description**: Get Doctor By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string (ENUM)",
    "status": "string (ENUM)",
    "consultationFee": 0,
    "consultationDurationMin": 0
  },
  "timestamp": "string"
}
```

---

### PUT /v1/doctors/{doctorId}
**Description**: Update Doctor

**Request Body** (`UpdateDoctorRequest`):
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "profilePhotoUrl": "string",
  "bio": "string",
  "consultationFee": 0,
  "consultationDurationMin": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string (ENUM)",
    "status": "string (ENUM)",
    "consultationFee": 0,
    "consultationDurationMin": 0
  },
  "timestamp": "string"
}
```

---

### GET /v1/doctors
**Description**: Get All Doctors

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "employeeCode": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "gender": "string (ENUM)",
      "status": "string (ENUM)",
      "consultationFee": 0,
      "consultationDurationMin": 0
    }
  ],
  "timestamp": "string"
}
```

---

### DELETE /v1/doctors/{doctorId}
**Description**: Delete Doctor

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /v1/doctors
**Description**: Add Doctor

**Request Body** (`AddDoctorRequest`):
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "gender": "string (ENUM)",
  "dob": "string",
  "joiningDate": "string",
  "consultationFee": 0,
  "consultationDurationMin": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string (ENUM)",
    "status": "string (ENUM)",
    "consultationFee": 0,
    "consultationDurationMin": 0
  },
  "timestamp": "string"
}
```

---

## DoctorScheduleController

### PUT /v1/doctor-schedules/{scheduleId}
**Description**: Update Schedule

**Request Body** (`UpdateDoctorScheduleRequest`):
```json
{
  "dayOfWeek": "string (ENUM)",
  "startTime": "string",
  "endTime": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "doctorId": "string",
    "doctorName": "string",
    "dayOfWeek": "string (ENUM)",
    "startTime": "string",
    "endTime": "string"
  },
  "timestamp": "string"
}
```

---

### POST /v1/doctor-schedules
**Description**: Add Schedule

**Request Body** (`AddDoctorScheduleRequest`):
```json
{
  "doctorId": "string",
  "dayOfWeek": "string (ENUM)",
  "startTime": "string",
  "endTime": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "doctorId": "string",
    "doctorName": "string",
    "dayOfWeek": "string (ENUM)",
    "startTime": "string",
    "endTime": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/doctor-schedules/doctor/{doctorId}
**Description**: Get Doctor Schedules

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "doctorId": "string",
      "doctorName": "string",
      "dayOfWeek": "string (ENUM)",
      "startTime": "string",
      "endTime": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/doctor-schedules/{scheduleId}
**Description**: Get Schedule By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "doctorId": "string",
    "doctorName": "string",
    "dayOfWeek": "string (ENUM)",
    "startTime": "string",
    "endTime": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/doctor-schedules/{scheduleId}
**Description**: Delete Schedule

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## DoctorSpecializationController

### POST /api/v1/doctors/{doctorId}/specializations
**Description**: Assign

**Request Body** (`AssignSpecializationRequest`):
```json
{
  "specializationId": "string",
  "primarySpecialization": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "doctorId": "string",
    "specializationId": "string",
    "specializationName": "string",
    "primarySpecialization": true
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/doctors/{doctorId}/specializations
**Description**: Get Doctor Specializations

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "doctorId": "string",
      "specializationId": "string",
      "specializationName": "string",
      "primarySpecialization": true
    }
  ],
  "timestamp": "string"
}
```

---

### DELETE /api/v1/doctors/{doctorId}/specializations/{specializationId}
**Description**: Remove

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## SpecializationController

### GET /api/v1/specializations/{id}
**Description**: Get By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/specializations/{id}
**Description**: Update

**Request Body** (`UpdateSpecializationRequest`):
```json
{
  "name": "string",
  "description": "string",
  "active": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/specializations/{id}
**Description**: Delete

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/specializations
**Description**: Create

**Request Body** (`CreateSpecializationRequest`):
```json
{
  "name": "string",
  "description": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/specializations
**Description**: Get All

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "active": true
    }
  ],
  "timestamp": "string"
}
```

---

## HospitalController

### DELETE /api/v1/hospitals/{id}
**Description**: Delete Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/hospitals/{id}
**Description**: Get Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "email": "string",
    "phone": "string",
    "gstNumber": "string",
    "licenseNumber": "string",
    "licenseExpiry": "string",
    "logoUrl": "string",
    "primaryColor": "string",
    "secondaryColor": "string",
    "invoiceLogoUrl": "string",
    "certificateLogoUrl": "string",
    "subdomain": "string",
    "status": "string (ENUM)",
    "subscriptionPlanId": "string",
    "addressLine1": "string",
    "cityId": "string",
    "cityName": "string",
    "stateId": "string",
    "stateName": "string",
    "pincode": "string",
    "country": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/hospitals
**Description**: Get All Hospitals

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "email": "string",
      "phone": "string",
      "gstNumber": "string",
      "licenseNumber": "string",
      "licenseExpiry": "string",
      "logoUrl": "string",
      "primaryColor": "string",
      "secondaryColor": "string",
      "invoiceLogoUrl": "string",
      "certificateLogoUrl": "string",
      "subdomain": "string",
      "status": "string (ENUM)",
      "subscriptionPlanId": "string",
      "addressLine1": "string",
      "cityId": "string",
      "cityName": "string",
      "stateId": "string",
      "stateName": "string",
      "pincode": "string",
      "country": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PUT /api/v1/hospitals/{id}
**Description**: Update Hospital

**Request Body** (`HospitalRequestDto`):
```json
{
  "name": "string",
  "slug": "string",
  "email": "string",
  "phone": "string",
  "gstNumber": "string",
  "licenseNumber": "string",
  "licenseExpiry": "string",
  "logoUrl": "string",
  "primaryColor": "string",
  "secondaryColor": "string",
  "invoiceLogoUrl": "string",
  "certificateLogoUrl": "string",
  "subdomain": "string",
  "subscriptionPlanId": "string",
  "addressLine1": "string",
  "cityId": "string",
  "stateId": "string",
  "pincode": "string",
  "country": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "email": "string",
    "phone": "string",
    "gstNumber": "string",
    "licenseNumber": "string",
    "licenseExpiry": "string",
    "logoUrl": "string",
    "primaryColor": "string",
    "secondaryColor": "string",
    "invoiceLogoUrl": "string",
    "certificateLogoUrl": "string",
    "subdomain": "string",
    "status": "string (ENUM)",
    "subscriptionPlanId": "string",
    "addressLine1": "string",
    "cityId": "string",
    "cityName": "string",
    "stateId": "string",
    "stateName": "string",
    "pincode": "string",
    "country": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/hospitals
**Description**: Create Hospital

**Request Body** (`HospitalRequestDto`):
```json
{
  "name": "string",
  "slug": "string",
  "email": "string",
  "phone": "string",
  "gstNumber": "string",
  "licenseNumber": "string",
  "licenseExpiry": "string",
  "logoUrl": "string",
  "primaryColor": "string",
  "secondaryColor": "string",
  "invoiceLogoUrl": "string",
  "certificateLogoUrl": "string",
  "subdomain": "string",
  "subscriptionPlanId": "string",
  "addressLine1": "string",
  "cityId": "string",
  "stateId": "string",
  "pincode": "string",
  "country": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "email": "string",
    "phone": "string",
    "gstNumber": "string",
    "licenseNumber": "string",
    "licenseExpiry": "string",
    "logoUrl": "string",
    "primaryColor": "string",
    "secondaryColor": "string",
    "invoiceLogoUrl": "string",
    "certificateLogoUrl": "string",
    "subdomain": "string",
    "status": "string (ENUM)",
    "subscriptionPlanId": "string",
    "addressLine1": "string",
    "cityId": "string",
    "cityName": "string",
    "stateId": "string",
    "stateName": "string",
    "pincode": "string",
    "country": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## HospitalDepartmentController

### GET /api/v1/hospitals/{hospitalId}/departments
**Description**: Get Departments

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "name": "string",
      "code": "string",
      "description": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PUT /api/v1/hospitals/{hospitalId}/departments/{departmentId}
**Description**: Update Department

**Request Body** (`HospitalDepartmentRequestDto`):
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/hospitals/{hospitalId}/departments/{departmentId}
**Description**: Get Department

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/hospitals/{hospitalId}/departments
**Description**: Create Department

**Request Body** (`HospitalDepartmentRequestDto`):
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/hospitals/{hospitalId}/departments/{departmentId}
**Description**: Delete Department

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## HospitalProfileController

### GET /api/v1/hospitals/{hospitalId}/profile
**Description**: Get Hospital Profile

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "hospitalId": "string",
    "name": "string",
    "slug": "string",
    "email": "string",
    "phone": "string",
    "gstNumber": "string",
    "licenseNumber": "string",
    "licenseExpiry": "string",
    "logoUrl": "string",
    "primaryColor": "string",
    "secondaryColor": "string",
    "invoiceLogoUrl": "string",
    "certificateLogoUrl": "string",
    "subdomain": "string",
    "status": "string (ENUM)",
    "subscriptionPlanId": "string",
    "addressLine1": "string",
    "cityId": "string",
    "cityName": "string",
    "stateId": "string",
    "stateName": "string",
    "pincode": "string",
    "country": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/hospitals/{hospitalId}/profile
**Description**: Update Hospital Profile

**Request Body** (`HospitalProfileRequestDto`):
```json
{
  "name": "string",
  "slug": "string",
  "email": "string",
  "phone": "string",
  "gstNumber": "string",
  "licenseNumber": "string",
  "licenseExpiry": "string",
  "logoUrl": "string",
  "primaryColor": "string",
  "secondaryColor": "string",
  "invoiceLogoUrl": "string",
  "certificateLogoUrl": "string",
  "subdomain": "string",
  "subscriptionPlanId": "string",
  "addressLine1": "string",
  "cityId": "string",
  "stateId": "string",
  "pincode": "string",
  "country": "string",
  "openingTime": "string",
  "closingTime": "string",
  "appointmentSlotDuration": 0,
  "maxAdvanceBookingDays": 0,
  "currency": "string",
  "timezone": "string",
  "paymentModes": "string",
  "gstRate": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "hospitalId": "string",
    "name": "string",
    "slug": "string",
    "email": "string",
    "phone": "string",
    "gstNumber": "string",
    "licenseNumber": "string",
    "licenseExpiry": "string",
    "logoUrl": "string",
    "primaryColor": "string",
    "secondaryColor": "string",
    "invoiceLogoUrl": "string",
    "certificateLogoUrl": "string",
    "subdomain": "string",
    "status": "string (ENUM)",
    "subscriptionPlanId": "string",
    "addressLine1": "string",
    "cityId": "string",
    "cityName": "string",
    "stateId": "string",
    "stateName": "string",
    "pincode": "string",
    "country": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## HospitalSettingsController

### GET /api/v1/hospitals/settings/{hospitalId}
**Description**: Get Settings

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/hospitals/settings/{hospitalId}
**Description**: Create Settings

**Request Body** (`HospitalSettingsRequestDto`):
```json
{
  "openingTime": "string",
  "closingTime": "string",
  "appointmentSlotDuration": 0,
  "maxAdvanceBookingDays": 0,
  "currency": "string",
  "timezone": "string",
  "paymentModes": "string",
  "gstRate": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/hospitals/settings/{hospitalId}
**Description**: Update Settings

**Request Body** (`HospitalSettingsRequestDto`):
```json
{
  "openingTime": "string",
  "closingTime": "string",
  "appointmentSlotDuration": 0,
  "maxAdvanceBookingDays": 0,
  "currency": "string",
  "timezone": "string",
  "paymentModes": "string",
  "gstRate": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "openingTime": "string",
    "closingTime": "string",
    "appointmentSlotDuration": 0,
    "maxAdvanceBookingDays": 0,
    "currency": "string",
    "timezone": "string",
    "paymentModes": "string",
    "gstRate": 0,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## AdmissionController

### POST /api/v1/admissions
**Description**: Create Admission

**Request Body** (`AdmissionRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "doctorId": "string",
  "ownerId": "string",
  "petId": "string",
  "wardId": "string",
  "bedId": "string",
  "admissionDate": "string",
  "admissionReason": "string",
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "admissionNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "admissionDate": "string",
    "admissionReason": "string",
    "status": "string (ENUM)",
    "notes": "string",
    "dischargeDate": "string",
    "dischargeSummary": "string",
    "dischargeNotes": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/admissions/{admissionId}
**Description**: Get Admission By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "admissionNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "admissionDate": "string",
    "admissionReason": "string",
    "status": "string (ENUM)",
    "notes": "string",
    "dischargeDate": "string",
    "dischargeSummary": "string",
    "dischargeNotes": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/admissions/{admissionId}/transfer-bed
**Description**: Transfer Bed

**Request Body** (`TransferBedRequestDto`):
```json
{
  "newBedId": "string",
  "reason": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "admissionNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "admissionDate": "string",
    "admissionReason": "string",
    "status": "string (ENUM)",
    "notes": "string",
    "dischargeDate": "string",
    "dischargeSummary": "string",
    "dischargeNotes": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/admissions/{admissionId}/discharge
**Description**: Discharge Admission

**Request Body** (`DischargeAdmissionRequestDto`):
```json
{
  "dischargeDate": "string",
  "dischargeSummary": "string",
  "dischargeNotes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "admissionNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "admissionDate": "string",
    "admissionReason": "string",
    "status": "string (ENUM)",
    "notes": "string",
    "dischargeDate": "string",
    "dischargeSummary": "string",
    "dischargeNotes": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/admissions/{admissionId}
**Description**: Update Admission

**Request Body** (`AdmissionUpdateRequestDto`):
```json
{
  "admissionReason": "string",
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "admissionNumber": "string",
    "hospitalName": "string",
    "branchName": "string",
    "doctorName": "string",
    "ownerName": "string",
    "petName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "admissionDate": "string",
    "admissionReason": "string",
    "status": "string (ENUM)",
    "notes": "string",
    "dischargeDate": "string",
    "dischargeSummary": "string",
    "dischargeNotes": "string"
  },
  "timestamp": "string"
}
```

---

## BedController

### POST /api/v1/beds
**Description**: Create Bed

**Request Body** (`BedRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "wardId": "string",
  "bedNumber": "string",
  "bedType": "string (ENUM)",
  "status": "string (ENUM)",
  "description": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalName": "string",
    "branchName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "bedType": "string (ENUM)",
    "status": "string (ENUM)",
    "description": "string",
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/beds/{bedId}
**Description**: Get Bed By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalName": "string",
    "branchName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "bedType": "string (ENUM)",
    "status": "string (ENUM)",
    "description": "string",
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/beds/{bedId}
**Description**: Update Bed

**Request Body** (`BedRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "wardId": "string",
  "bedNumber": "string",
  "bedType": "string (ENUM)",
  "status": "string (ENUM)",
  "description": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalName": "string",
    "branchName": "string",
    "wardName": "string",
    "bedNumber": "string",
    "bedType": "string (ENUM)",
    "status": "string (ENUM)",
    "description": "string",
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/beds/search
**Description**: Search Beds

**Request Body** (`BedSearchRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "wardId": "string",
  "bedNumber": "string",
  "bedType": "string (ENUM)",
  "status": "string (ENUM)",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalName": "string",
      "branchName": "string",
      "wardName": "string",
      "bedNumber": "string",
      "bedType": "string (ENUM)",
      "status": "string (ENUM)",
      "description": "string",
      "isActive": true
    }
  ],
  "timestamp": "string"
}
```

---

## WardController

### GET /api/v1/wards/hospital/{hospitalId}
**Description**: Get Wards By Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "branchId": "string",
      "branchName": "string",
      "name": "string",
      "code": "string",
      "wardType": "string (ENUM)",
      "description": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/wards
**Description**: Create Ward

**Request Body** (`WardRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "name": "string",
  "code": "string",
  "wardType": "string (ENUM)",
  "description": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "name": "string",
    "code": "string",
    "wardType": "string (ENUM)",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/wards/{wardId}
**Description**: Get Ward

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "name": "string",
    "code": "string",
    "wardType": "string (ENUM)",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/wards/{wardId}
**Description**: Delete Ward

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### PUT /api/v1/wards/{wardId}
**Description**: Update Ward

**Request Body** (`WardRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "name": "string",
  "code": "string",
  "wardType": "string (ENUM)",
  "description": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "name": "string",
    "code": "string",
    "wardType": "string (ENUM)",
    "description": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## InventoryController

### POST /api/v1/inventory/stock/entry
**Description**: Add Stock Entry

**Request Body** (`StockEntryRequest`):
```json
{
  "hospitalId": "string",
  "itemId": "string",
  "supplierId": "string",
  "batchNumber": "string",
  "quantity": 0,
  "purchasePrice": 0,
  "mrp": 0,
  "expiryDate": "string",
  "entryType": "string (ENUM)",
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/inventory/low-stock
**Description**: Get Low Stock

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "sku": "string",
      "name": "string",
      "category": "string (ENUM)",
      "hsnCode": "string",
      "taxRate": 0,
      "unit": "string",
      "reorderLevel": 0,
      "currentStock": 0,
      "isActive": true
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/inventory/stock/transfer
**Description**: Transfer Stock

**Request Body** (`StockTransferRequest`):
```json
{
  "sourceItemId": "string",
  "destinationHospitalId": "string",
  "quantity": 0,
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/inventory/expiry
**Description**: Get Expiring Items

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "itemId": "string",
      "itemName": "string",
      "batchNumber": "string",
      "expiryDate": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/inventory/items
**Description**: Get All Items

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "sku": "string",
      "name": "string",
      "category": "string (ENUM)",
      "hsnCode": "string",
      "taxRate": 0,
      "unit": "string",
      "reorderLevel": 0,
      "currentStock": 0,
      "isActive": true
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/inventory/stock/adjust
**Description**: Adjust Stock

**Request Body** (`StockAdjustRequest`):
```json
{
  "itemId": "string",
  "quantity": 0,
  "notes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/inventory/items
**Description**: Create Item

**Request Body** (`InventoryItemCreateRequest`):
```json
{
  "hospitalId": "string",
  "sku": "string",
  "name": "string",
  "category": "string (ENUM)",
  "hsnCode": "string",
  "taxRate": 0,
  "unit": "string",
  "reorderLevel": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "sku": "string",
    "name": "string",
    "category": "string (ENUM)",
    "hsnCode": "string",
    "taxRate": 0,
    "unit": "string",
    "reorderLevel": 0,
    "currentStock": 0,
    "isActive": true
  },
  "timestamp": "string"
}
```

---

## SupplierController

### POST /api/v1/inventory/suppliers
**Description**: Create Supplier

**Request Body** (`SupplierCreateRequest`):
```json
{
  "hospitalId": "string",
  "name": "string",
  "contactPerson": "string",
  "phone": "string",
  "email": "string",
  "gstin": "string",
  "paymentTerms": "string",
  "leadTimeDays": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "name": "string",
    "contactPerson": "string",
    "phone": "string",
    "email": "string",
    "gstin": "string",
    "paymentTerms": "string",
    "leadTimeDays": 0,
    "isActive": true
  },
  "timestamp": "string"
}
```

---

## LabOrderController

### GET /api/v1/lab-orders/hospital/{hospitalId}
**Description**: Get Lab Orders By Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "branchId": "string",
      "consultationId": "string",
      "labTestId": "string",
      "priority": "string (ENUM)",
      "status": "string (ENUM)",
      "clinicalNotes": "string",
      "orderedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-orders/branch/{branchId}
**Description**: Get Lab Orders By Branch

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "branchId": "string",
      "consultationId": "string",
      "labTestId": "string",
      "priority": "string (ENUM)",
      "status": "string (ENUM)",
      "clinicalNotes": "string",
      "orderedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-orders/consultation/{consultationId}
**Description**: Get Lab Orders By Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "branchId": "string",
      "consultationId": "string",
      "labTestId": "string",
      "priority": "string (ENUM)",
      "status": "string (ENUM)",
      "clinicalNotes": "string",
      "orderedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PATCH /api/v1/lab-orders/{labOrderId}/cancel
**Description**: Cancel Lab Order

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-orders
**Description**: Get All Lab Orders

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "branchId": "string",
      "consultationId": "string",
      "labTestId": "string",
      "priority": "string (ENUM)",
      "status": "string (ENUM)",
      "clinicalNotes": "string",
      "orderedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-orders/{labOrderId}
**Description**: Get Lab Order By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "branchId": "string",
    "consultationId": "string",
    "labTestId": "string",
    "priority": "string (ENUM)",
    "status": "string (ENUM)",
    "clinicalNotes": "string",
    "orderedAt": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/lab-orders
**Description**: Create Lab Order

**Request Body** (`CreateLabOrderRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "consultationId": "string",
  "labTestId": "string",
  "priority": "string (ENUM)",
  "clinicalNotes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "branchId": "string",
    "consultationId": "string",
    "labTestId": "string",
    "priority": "string (ENUM)",
    "status": "string (ENUM)",
    "clinicalNotes": "string",
    "orderedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/lab-orders/{labOrderId}
**Description**: Update Lab Order

**Request Body** (`UpdateLabOrderRequestDto`):
```json
{
  "priority": "string (ENUM)",
  "status": "string (ENUM)",
  "clinicalNotes": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "branchId": "string",
    "consultationId": "string",
    "labTestId": "string",
    "priority": "string (ENUM)",
    "status": "string (ENUM)",
    "clinicalNotes": "string",
    "orderedAt": "string"
  },
  "timestamp": "string"
}
```

---

## LabResultController

### GET /api/v1/lab-results/lab-order/{labOrderId}
**Description**: Get Lab Result By Lab Order

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "labOrderId": "string",
    "result": "string",
    "remarks": "string",
    "reportUrl": "string",
    "testedBy": "string",
    "resultDate": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/lab-results
**Description**: Create Lab Result

**Request Body** (`CreateLabResultRequestDto`):
```json
{
  "labOrderId": "string",
  "result": "string",
  "remarks": "string",
  "reportUrl": "string",
  "testedBy": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "labOrderId": "string",
    "result": "string",
    "remarks": "string",
    "reportUrl": "string",
    "testedBy": "string",
    "resultDate": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-results/{labResultId}
**Description**: Get Lab Result By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "labOrderId": "string",
    "result": "string",
    "remarks": "string",
    "reportUrl": "string",
    "testedBy": "string",
    "resultDate": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/lab-results/{labResultId}
**Description**: Update Lab Result

**Request Body** (`UpdateLabResultRequestDto`):
```json
{
  "result": "string",
  "remarks": "string",
  "reportUrl": "string",
  "testedBy": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "labOrderId": "string",
    "result": "string",
    "remarks": "string",
    "reportUrl": "string",
    "testedBy": "string",
    "resultDate": "string"
  },
  "timestamp": "string"
}
```

---

## CityController

### GET /api/v1/cities/{cityId}
**Description**: Get City

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "stateId": "string",
    "stateName": "string",
    "name": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/cities/{cityId}
**Description**: Update City

**Request Body** (`CityRequestDto`):
```json
{
  "stateId": "string",
  "name": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "stateId": "string",
    "stateName": "string",
    "name": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/cities/{cityId}
**Description**: Delete City

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/cities
**Description**: Create City

**Request Body** (`CityRequestDto`):
```json
{
  "stateId": "string",
  "name": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "stateId": "string",
    "stateName": "string",
    "name": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/cities
**Description**: Get All Cities

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "stateId": "string",
      "stateName": "string",
      "name": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/cities/state/{stateId}
**Description**: Get Cities By State

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "stateId": "string",
      "stateName": "string",
      "name": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

## DesignationController

### PATCH /api/v1/designations/{designationId}/status
**Description**: Update Designation Status

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/designations/hospital/{hospitalId}
**Description**: Get Designations By Hospital

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "departmentId": "string",
      "departmentName": "string",
      "name": "string",
      "code": "string",
      "description": "string",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/designations/department/{departmentId}
**Description**: Get Designations By Department

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "departmentId": "string",
      "departmentName": "string",
      "name": "string",
      "code": "string",
      "description": "string",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/designations
**Description**: Create Designation

**Request Body** (`DesignationRequestDto`):
```json
{
  "hospitalId": "string",
  "departmentId": "string",
  "name": "string",
  "code": "string",
  "description": "string",
  "displayOrder": 0,
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/designations/{designationId}
**Description**: Delete Designation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### PUT /api/v1/designations/{designationId}
**Description**: Update Designation

**Request Body** (`DesignationRequestDto`):
```json
{
  "hospitalId": "string",
  "departmentId": "string",
  "name": "string",
  "code": "string",
  "description": "string",
  "displayOrder": 0,
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/designations
**Description**: Get All Designations

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "departmentId": "string",
      "departmentName": "string",
      "name": "string",
      "code": "string",
      "description": "string",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/designations/{designationId}
**Description**: Get Designation By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "name": "string",
    "code": "string",
    "description": "string",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## LabTestController

### GET /api/v1/lab-tests/category/{category}
**Description**: Get Lab Tests By Category

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "category": "string (ENUM)",
      "description": "string",
      "normalTurnaroundHours": 0,
      "isActive": true
    }
  ],
  "timestamp": "string"
}
```

---

### PATCH /api/v1/lab-tests/{labTestId}/deactivate
**Description**: Deactivate Lab Test

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/lab-tests
**Description**: Create Lab Test

**Request Body** (`CreateLabTestRequestDto`):
```json
{
  "name": "string",
  "code": "string",
  "category": "string (ENUM)",
  "description": "string",
  "normalTurnaroundHours": 0
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "category": "string (ENUM)",
    "description": "string",
    "normalTurnaroundHours": 0,
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-tests/{labTestId}
**Description**: Get Lab Test By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "category": "string (ENUM)",
    "description": "string",
    "normalTurnaroundHours": 0,
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/lab-tests/{labTestId}
**Description**: Update Lab Test

**Request Body** (`UpdateLabTestRequestDto`):
```json
{
  "name": "string",
  "code": "string",
  "category": "string (ENUM)",
  "description": "string",
  "normalTurnaroundHours": 0,
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "category": "string (ENUM)",
    "description": "string",
    "normalTurnaroundHours": 0,
    "isActive": true
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/lab-tests
**Description**: Get All Lab Tests

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "category": "string (ENUM)",
      "description": "string",
      "normalTurnaroundHours": 0,
      "isActive": true
    }
  ],
  "timestamp": "string"
}
```

---

## MasterDataImportController

### POST /api/v1/master/import
**Description**: Import Master Data

**Request Body**: None or Form Data

**Response** (`String`):
```json
"string"
```

---

## StateController

### PUT /api/v1/states/{stateId}
**Description**: Update State

**Request Body** (`StateRequestDto`):
```json
{
  "name": "string",
  "countryId": "string",
  "code": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "countryId": "string",
    "countryName": "string",
    "name": "string",
    "code": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/states/{stateId}
**Description**: Delete State

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/states
**Description**: Create State

**Request Body** (`StateRequestDto`):
```json
{
  "name": "string",
  "countryId": "string",
  "code": "string",
  "isActive": true
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "countryId": "string",
    "countryName": "string",
    "name": "string",
    "code": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/states
**Description**: Get All States

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "countryId": "string",
      "countryName": "string",
      "name": "string",
      "code": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/states/{stateId}
**Description**: Get State

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "countryId": "string",
    "countryName": "string",
    "name": "string",
    "code": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "string"
}
```

---

## PaymentController

### POST /api/v1/payments
**Description**: Process Payment

**Request Body** (`PaymentRequest`):
```json
{

}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {

  },
  "timestamp": "string"
}
```

---

## CommunicationHistoryController

### POST /api/v1/pet-owners/{ownerId}/communications
**Description**: Create Communication

**Request Body** (`CommunicationHistoryRequestDto`):
```json
{
  "communicationType": "string",
  "messageContent": "string",
  "status": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "ownerId": "string",
    "communicationType": "string",
    "messageContent": "string",
    "sentAt": "string",
    "status": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/communications/{communicationId}
**Description**: Get Communication By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "ownerId": "string",
    "communicationType": "string",
    "messageContent": "string",
    "sentAt": "string",
    "status": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/pet-owners/{ownerId}/communications
**Description**: Get Owner Communications

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "ownerId": "string",
      "communicationType": "string",
      "messageContent": "string",
      "sentAt": "string",
      "status": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### DELETE /api/v1/communications/{communicationId}
**Description**: Delete Communication

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

## OwnerDocumentController

### GET /api/v1/pet-owners/{ownerId}/documents
**Description**: Get Owner Documents

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "ownerId": "string",
      "documentName": "string",
      "documentType": "string",
      "documentUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### DELETE /api/v1/pet-owners/documents/{documentId}
**Description**: Delete Document

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### POST /api/v1/pet-owners/{ownerId}/documents
**Description**: Upload Document

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "ownerId": "string",
    "documentName": "string",
    "documentType": "string",
    "documentUrl": "string"
  },
  "timestamp": "string"
}
```

---

## PetController

### POST /api/v1/pets/lookup-or-create
**Description**: Lookup Or Create Pet

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petName": "string",
    "age": 0,
    "gender": "string",
    "weight": 0,
    "color": "string",
    "dateOfBirth": "string",
    "microchipNumber": "string",
    "allergies": "string",
    "photoUrl": "string",
    "status": "string",
    "ownerId": "string",
    "speciesId": "string",
    "breedId": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/pets/history/{id}
**Description**: Get Pet History

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petName": "string",
    "age": 0,
    "gender": "string",
    "weight": 0,
    "color": "string",
    "dateOfBirth": "string",
    "microchipNumber": "string",
    "allergies": "string",
    "photoUrl": "string",
    "status": "string",
    "ownerId": "string",
    "speciesId": "string",
    "breedId": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/pets
**Description**: Create Pet

**Request Body** (`PetRequest`):
```json
{
  "ownerId": "string",
  "petName": "string",
  "speciesId": "string",
  "breedId": "string",
  "gender": "string",
  "dateOfBirth": "string",
  "allergyInformation": "string",
  "photoUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petName": "string",
    "age": 0,
    "gender": "string",
    "weight": 0,
    "color": "string",
    "dateOfBirth": "string",
    "microchipNumber": "string",
    "allergies": "string",
    "photoUrl": "string",
    "status": "string",
    "ownerId": "string",
    "speciesId": "string",
    "breedId": "string"
  },
  "timestamp": "string"
}
```

---

## PetOwnerController

### GET /api/v1/pet-owners/search
**Description**: Search Owners

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "email": "string",
      "address": "string",
      "pets": [
        {
          "id": "string",
          "petName": "string",
          "age": 0,
          "gender": "string",
          "weight": 0,
          "color": "string",
          "dateOfBirth": "string",
          "microchipNumber": "string",
          "allergies": "string",
          "photoUrl": "string",
          "status": "string",
          "ownerId": "string",
          "speciesId": "string",
          "breedId": "string"
        }
      ]
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/pet-owners/{ownerId}
**Description**: Get Owner By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "email": "string",
    "address": "string",
    "pets": [
      {
        "id": "string",
        "petName": "string",
        "age": 0,
        "gender": "string",
        "weight": 0,
        "color": "string",
        "dateOfBirth": "string",
        "microchipNumber": "string",
        "allergies": "string",
        "photoUrl": "string",
        "status": "string",
        "ownerId": "string",
        "speciesId": "string",
        "breedId": "string"
      }
    ]
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/pet-owners
**Description**: Create Owner

**Request Body** (`PetOwnerRequest`):
```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "email": "string",
  "address": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "email": "string",
    "address": "string",
    "pets": [
      {
        "id": "string",
        "petName": "string",
        "age": 0,
        "gender": "string",
        "weight": 0,
        "color": "string",
        "dateOfBirth": "string",
        "microchipNumber": "string",
        "allergies": "string",
        "photoUrl": "string",
        "status": "string",
        "ownerId": "string",
        "speciesId": "string",
        "breedId": "string"
      }
    ]
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/pet-owners/lookup-or-create
**Description**: Lookup Or Create Owner

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "phoneNumber": "string",
    "email": "string",
    "address": "string",
    "pets": [
      {
        "id": "string",
        "petName": "string",
        "age": 0,
        "gender": "string",
        "weight": 0,
        "color": "string",
        "dateOfBirth": "string",
        "microchipNumber": "string",
        "allergies": "string",
        "photoUrl": "string",
        "status": "string",
        "ownerId": "string",
        "speciesId": "string",
        "breedId": "string"
      }
    ]
  },
  "timestamp": "string"
}
```

---

## BreedController

### GET /api/breeds/species/{speciesId}
**Description**: Get By Species

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "speciesId": "string",
      "speciesName": "string",
      "name": "string",
      "description": "string",
      "active": true
    }
  ],
  "timestamp": "string"
}
```

---

### DELETE /api/breeds/{id}
**Description**: Delete

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "string",
  "timestamp": "string"
}
```

---

### POST /api/breeds
**Description**: Create

**Request Body** (`CreateBreedRequest`):
```json
{
  "speciesId": "string",
  "name": "string",
  "description": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "speciesId": "string",
    "speciesName": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### GET /api/breeds
**Description**: Get All

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "speciesId": "string",
      "speciesName": "string",
      "name": "string",
      "description": "string",
      "active": true
    }
  ],
  "timestamp": "string"
}
```

---

## SpeciesController

### GET /api/species/{id}
**Description**: Get By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### DELETE /api/species/{id}
**Description**: Delete

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": "string",
  "timestamp": "string"
}
```

---

### POST /api/species
**Description**: Create

**Request Body** (`CreateSpeciesRequest`):
```json
{
  "name": "string",
  "description": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "active": true
  },
  "timestamp": "string"
}
```

---

### GET /api/species
**Description**: Get All

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "active": true
    }
  ],
  "timestamp": "string"
}
```

---

## PrescriptionController

### POST /v1/prescriptions
**Description**: Add Prescription

**Request Body** (`AddPrescriptionRequest`):
```json
{
  "consultationId": "string",
  "medicineName": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string",
  "instructions": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "medicineName": "string",
    "dosage": "string",
    "frequency": "string",
    "duration": "string",
    "instructions": "string",
    "pdfUrl": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/prescriptions/{prescriptionId}
**Description**: Delete Prescription

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### PUT /v1/prescriptions/{prescriptionId}
**Description**: Update Prescription

**Request Body** (`UpdatePrescriptionRequest`):
```json
{
  "medicineName": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string",
  "instructions": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "medicineName": "string",
    "dosage": "string",
    "frequency": "string",
    "duration": "string",
    "instructions": "string",
    "pdfUrl": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/prescriptions/consultation/{consultationId}
**Description**: Get Prescriptions By Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "medicineName": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string",
      "pdfUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/prescriptions/{prescriptionId}
**Description**: Get Prescription By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "medicineName": "string",
    "dosage": "string",
    "frequency": "string",
    "duration": "string",
    "instructions": "string",
    "pdfUrl": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/prescriptions
**Description**: Get All Prescriptions

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "medicineName": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string",
      "pdfUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

## ProcedureController

### POST /v1/procedures
**Description**: Add Procedure

**Request Body** (`AddProcedureRequest`):
```json
{
  "consultationId": "string",
  "procedureType": "string",
  "procedureDate": "string",
  "notes": "string",
  "veterinarian": "string",
  "status": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "procedureType": "string",
    "procedureDate": "string",
    "notes": "string",
    "veterinarian": "string",
    "status": "string"
  },
  "timestamp": "string"
}
```

---

### GET /v1/procedures/{procedureId}
**Description**: Get Procedure By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "procedureType": "string",
    "procedureDate": "string",
    "notes": "string",
    "veterinarian": "string",
    "status": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /v1/procedures/{procedureId}
**Description**: Update Procedure

**Request Body** (`UpdateProcedureRequest`):
```json
{
  "procedureType": "string",
  "procedureDate": "string",
  "notes": "string",
  "veterinarian": "string",
  "status": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "consultationId": "string",
    "procedureType": "string",
    "procedureDate": "string",
    "notes": "string",
    "veterinarian": "string",
    "status": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /v1/procedures/{procedureId}
**Description**: Delete Procedure

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /v1/procedures
**Description**: Get All Procedures

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "procedureType": "string",
      "procedureDate": "string",
      "notes": "string",
      "veterinarian": "string",
      "status": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /v1/procedures/consultation/{consultationId}
**Description**: Get Procedures By Consultation

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "consultationId": "string",
      "procedureType": "string",
      "procedureDate": "string",
      "notes": "string",
      "veterinarian": "string",
      "status": "string"
    }
  ],
  "timestamp": "string"
}
```

---

## ReceptionQueueController

### POST /api/v1/reception/check-in
**Description**: Check In

**Request Body** (`CheckInRequestDto`):
```json
{
  "appointmentId": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/reception/{queueId}/no-show
**Description**: Mark No Show

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/reception/call-next
**Description**: Call Next Patient

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/reception/{queueId}/skip
**Description**: Skip Patient

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/reception/{queueId}/recall
**Description**: Recall Patient

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/reception/queue
**Description**: Get Today Queue

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "appointmentId": "string",
      "appointmentNumber": "string",
      "ownerName": "string",
      "petName": "string",
      "doctorName": "string",
      "tokenNumber": "string",
      "queuePosition": 0,
      "status": "string (ENUM)",
      "checkInTime": "string",
      "calledTime": "string",
      "completedTime": "string",
      "remarks": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PUT /api/v1/reception/{queueId}/complete
**Description**: Complete Patient

**Request Body**: None or Form Data

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "appointmentId": "string",
    "appointmentNumber": "string",
    "ownerName": "string",
    "petName": "string",
    "doctorName": "string",
    "tokenNumber": "string",
    "queuePosition": 0,
    "status": "string (ENUM)",
    "checkInTime": "string",
    "calledTime": "string",
    "completedTime": "string",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

## StaffAttendanceController

### PUT /api/v1/staff-attendance/{attendanceId}/check-out
**Description**: Check Out

**Request Body** (`StaffCheckOutRequestDto`):
```json
{
  "remarks": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "staffId": "string",
    "employeeCode": "string",
    "staffName": "string",
    "attendanceDate": "string",
    "checkInTime": "string",
    "checkOutTime": "string",
    "workingMinutes": 0,
    "status": "string (ENUM)",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/staff-attendance/check-in
**Description**: Check In

**Request Body** (`StaffCheckInRequestDto`):
```json
{
  "staffId": "string",
  "remarks": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "staffId": "string",
    "employeeCode": "string",
    "staffName": "string",
    "attendanceDate": "string",
    "checkInTime": "string",
    "checkOutTime": "string",
    "workingMinutes": 0,
    "status": "string (ENUM)",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### POST /api/v1/staff-attendance/search
**Description**: Search Attendance

**Request Body** (`AttendanceSearchRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "departmentId": "string",
  "staffId": "string",
  "status": "string (ENUM)",
  "fromDate": "string",
  "toDate": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "employeeCode": "string",
      "staffName": "string",
      "department": "string",
      "designation": "string",
      "attendanceDate": "string",
      "status": "string (ENUM)",
      "workingHours": 0
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/staff-attendance/{attendanceId}
**Description**: Get Attendance By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "staffId": "string",
    "employeeCode": "string",
    "staffName": "string",
    "attendanceDate": "string",
    "checkInTime": "string",
    "checkOutTime": "string",
    "workingMinutes": 0,
    "status": "string (ENUM)",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/staff-attendance/staff/{staffId}
**Description**: Get Attendance By Staff

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "staffId": "string",
      "employeeCode": "string",
      "staffName": "string",
      "attendanceDate": "string",
      "checkInTime": "string",
      "checkOutTime": "string",
      "workingMinutes": 0,
      "status": "string (ENUM)",
      "remarks": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/staff-attendance/summary
**Description**: Get Attendance Summary

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "totalStaff": 0,
    "present": 0,
    "absent": 0,
    "halfDay": 0,
    "onLeave": 0
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/staff-attendance/date
**Description**: Get Attendance By Date

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "staffId": "string",
      "employeeCode": "string",
      "staffName": "string",
      "attendanceDate": "string",
      "checkInTime": "string",
      "checkOutTime": "string",
      "workingMinutes": 0,
      "status": "string (ENUM)",
      "remarks": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### PUT /api/v1/staff-attendance/{attendanceId}/status
**Description**: Update Attendance Status

**Request Body** (`AttendanceStatusUpdateRequestDto`):
```json
{
  "status": "string (ENUM)",
  "remarks": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "staffId": "string",
    "employeeCode": "string",
    "staffName": "string",
    "attendanceDate": "string",
    "checkInTime": "string",
    "checkOutTime": "string",
    "workingMinutes": 0,
    "status": "string (ENUM)",
    "remarks": "string"
  },
  "timestamp": "string"
}
```

---

## StaffController

### PUT /api/v1/staff/{staffId}
**Description**: Update Staff

**Request Body** (`StaffRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "userId": "string",
  "departmentId": "string",
  "designationId": "string",
  "employeeCode": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "gender": "string",
  "dob": "string",
  "qualification": "string",
  "joinDate": "string",
  "status": "string (ENUM)",
  "profileImageUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "userId": "string",
    "departmentId": "string",
    "departmentName": "string",
    "designationId": "string",
    "designationName": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string",
    "dob": "string",
    "qualification": "string",
    "joinDate": "string",
    "status": "string (ENUM)",
    "profileImageUrl": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/staff/{staffId}
**Description**: Get Staff By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "userId": "string",
    "departmentId": "string",
    "departmentName": "string",
    "designationId": "string",
    "designationName": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string",
    "dob": "string",
    "qualification": "string",
    "joinDate": "string",
    "status": "string (ENUM)",
    "profileImageUrl": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/staff/{staffId}
**Description**: Delete Staff

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/staff
**Description**: Get All Staff

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "hospitalId": "string",
      "hospitalName": "string",
      "branchId": "string",
      "branchName": "string",
      "userId": "string",
      "departmentId": "string",
      "departmentName": "string",
      "designationId": "string",
      "designationName": "string",
      "employeeCode": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "gender": "string",
      "dob": "string",
      "qualification": "string",
      "joinDate": "string",
      "status": "string (ENUM)",
      "profileImageUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/staff
**Description**: Create Staff

**Request Body** (`StaffRequestDto`):
```json
{
  "hospitalId": "string",
  "branchId": "string",
  "userId": "string",
  "departmentId": "string",
  "designationId": "string",
  "employeeCode": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "gender": "string",
  "dob": "string",
  "qualification": "string",
  "joinDate": "string",
  "status": "string (ENUM)",
  "profileImageUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "userId": "string",
    "departmentId": "string",
    "departmentName": "string",
    "designationId": "string",
    "designationName": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string",
    "dob": "string",
    "qualification": "string",
    "joinDate": "string",
    "status": "string (ENUM)",
    "profileImageUrl": "string"
  },
  "timestamp": "string"
}
```

---

## StaffProfileController

### PUT /api/v1/staff/profile/{staffId}
**Description**: Update Staff Profile

**Request Body** (`StaffProfileUpdateRequestDto`):
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "gender": "string",
  "dob": "string",
  "qualification": "string",
  "profileImageUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "staffId": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string",
    "dob": "string",
    "qualification": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "designationId": "string",
    "designationName": "string",
    "joinDate": "string",
    "status": "string (ENUM)",
    "profileImageUrl": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/staff/profile/{staffId}
**Description**: Get Staff Profile

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "staffId": "string",
    "employeeCode": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "gender": "string",
    "dob": "string",
    "qualification": "string",
    "hospitalId": "string",
    "hospitalName": "string",
    "branchId": "string",
    "branchName": "string",
    "departmentId": "string",
    "departmentName": "string",
    "designationId": "string",
    "designationName": "string",
    "joinDate": "string",
    "status": "string (ENUM)",
    "profileImageUrl": "string"
  },
  "timestamp": "string"
}
```

---

## PasswordTestController

## VaccinationController

### GET /api/v1/vaccinations/{id}
**Description**: Get Vaccination By Id

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petId": "string",
    "petName": "string",
    "ownerId": "string",
    "ownerName": "string",
    "vaccineName": "string",
    "vaccinationDate": "string",
    "nextDueDate": "string",
    "certificateUrl": "string"
  },
  "timestamp": "string"
}
```

---

### GET /api/v1/vaccinations
**Description**: Get All Vaccinations

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "petId": "string",
      "petName": "string",
      "ownerId": "string",
      "ownerName": "string",
      "vaccineName": "string",
      "vaccinationDate": "string",
      "nextDueDate": "string",
      "certificateUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### GET /api/v1/vaccinations/due
**Description**: Get Due Vaccinations

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "petId": "string",
      "petName": "string",
      "ownerId": "string",
      "ownerName": "string",
      "vaccineName": "string",
      "vaccinationDate": "string",
      "nextDueDate": "string",
      "certificateUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

### POST /api/v1/vaccinations
**Description**: Create Vaccination

**Request Body** (`VaccinationRequestDto`):
```json
{
  "petId": "string",
  "vaccineName": "string",
  "vaccinationDate": "string",
  "nextDueDate": "string",
  "certificateUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petId": "string",
    "petName": "string",
    "ownerId": "string",
    "ownerName": "string",
    "vaccineName": "string",
    "vaccinationDate": "string",
    "nextDueDate": "string",
    "certificateUrl": "string"
  },
  "timestamp": "string"
}
```

---

### PUT /api/v1/vaccinations/{id}
**Description**: Update Vaccination

**Request Body** (`VaccinationRequestDto`):
```json
{
  "petId": "string",
  "vaccineName": "string",
  "vaccinationDate": "string",
  "nextDueDate": "string",
  "certificateUrl": "string"
}
```

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": {
    "id": "string",
    "petId": "string",
    "petName": "string",
    "ownerId": "string",
    "ownerName": "string",
    "vaccineName": "string",
    "vaccinationDate": "string",
    "nextDueDate": "string",
    "certificateUrl": "string"
  },
  "timestamp": "string"
}
```

---

### DELETE /api/v1/vaccinations/{id}
**Description**: Delete Vaccination

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": null,
  "timestamp": "string"
}
```

---

### GET /api/v1/vaccinations/pet/{petId}
**Description**: Get Vaccinations By Pet

**Response** (`ApiResponse`):
```json
{
  "success": true,
  "verified": true,
  "message": "string",
  "data": [
    {
      "id": "string",
      "petId": "string",
      "petName": "string",
      "ownerId": "string",
      "ownerName": "string",
      "vaccineName": "string",
      "vaccinationDate": "string",
      "nextDueDate": "string",
      "certificateUrl": "string"
    }
  ],
  "timestamp": "string"
}
```

---

