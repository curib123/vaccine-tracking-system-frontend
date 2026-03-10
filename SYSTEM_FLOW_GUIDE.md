# Vaccine Tracking System Flow Guide

## 1. Purpose of the system

This system manages the full immunization process for a health center:

- Admin users set up roles, staff accounts, parents, children, vaccines, visits, and immunization records.
- Parent users log in to view their children, immunization records, announcements, and profile.

The frontend connects to the backend API through `src/lib/api.ts`, which automatically sends the JWT token stored in `sessionStorage`.

## 2. Main connection of data

The system is connected in this order:

1. Role
2. User
3. Parent
4. Child
5. Vaccine
6. Vaccine Schedule
7. Immunization Record
8. Visit
9. Attached Record to Visit
10. Parent view / Admin monitoring

In simple form:

- A `Role` controls what an admin user can access.
- A `User` is an account that can log in.
- A `Parent` account can have many `Children`.
- A `Vaccine` contains one or more dose schedules.
- A `Child` receives generated immunization records based on selected vaccines.
- A `Visit` is the actual clinic appointment.
- Pending immunization records are attached to a visit and marked with a final status such as completed, skipped, or cancelled.

## 3. Login and access flow

### Step 1: User logs in

Screen:

- `src/app/login/page.tsx`

What happens:

1. User enters email and password.
2. Frontend calls `POST /auth/loginUser`.
3. Token is saved in `sessionStorage`.
4. User data is saved in `sessionStorage`.
5. System checks the role name.
6. If the role matches the configured parent role, user is sent to `/user/dashboard`.
7. Otherwise user is sent to `/admin/dashboard`.

## 4. Admin flow from start to end

This is the recommended real-world setup order.

### Step 2: Create roles first

Screen:

- `src/app/admin/roles/page.tsx`

Modal:

- `src/components/modal/RoleModal.tsx`

When to enter data:

- Enter role data before creating users if you need custom permissions.

What to input:

- Role name
- Assigned permissions

Why this matters:

- Users need a role before they can be assigned correct access.

### Step 3: Create user accounts

Screen:

- `src/app/admin/users/page.tsx`

Modal:

- `src/components/modal/UpsertUserModal.tsx`

When to enter data:

- After roles are ready.

What to input:

- First name
- Middle name
- Last name
- Contact number
- Address
- Email
- Password for new account
- Role

Backend actions:

- Create user: `POST /auth/registerUser`
- Update user: `PUT /user/updateUserById/:userId`

Typical use:

- Create admin/staff/nurse accounts
- Create parent account if parent login is handled as a user role in your backend

### Step 4: Register parent accounts

Screen:

- `src/app/admin/parents/page.tsx`

When to enter data:

- After the parent user exists in the system.

What this screen does:

- Lists parents
- Lets admin inspect each parent’s children
- Lets admin inspect each child’s immunization records

Important note:

- This frontend page is for viewing/managing parent data already stored in the backend.
- Parent-child linkage is used later when creating children.

### Step 5: Register children under the correct parent

Screen:

- `src/app/admin/children/page.tsx`

Modal:

- `src/components/modal/UpsertChildModal.tsx`

When to enter data:

- After the parent exists.

What to input:

- Parent / Guardian
- First name
- Middle name
- Last name
- Gender
- Birth date
- Birth place

Backend actions:

- Create child: `POST /child/create`
- Update child: `PUT /child/update/:childId`

Why this matters:

- The child record is the center of the immunization process.
- No vaccine records can be generated until the child exists.

### Step 6: Create vaccines and schedules

Screen:

- `src/app/admin/vaccines/page.tsx`

Modal:

- `src/components/modal/UpsertVaccineModal.tsx`

When to enter data:

- Before generating immunization records for children.

What to input:

- Vaccine name
- Description
- Recommended age text
- Total required doses
- Whether booster is required
- Booster timing
- Dose schedule rules

Dose schedule data includes:

- Dose label
- Dose number
- Recommended age in months
- Interval in days if needed

Backend actions:

- Create vaccine: `POST /vaccine/create`
- Update vaccine: `PUT /vaccine/update/:vaccineId`

Why this matters:

- Vaccine schedules are the template used to generate child immunization records.

### Step 7: Generate immunization records for a child

Screen:

- `src/app/admin/children/page.tsx`

Modal:

- `src/components/modal/GenerateVaccineModal.tsx`

When to enter data:

- After both the child and vaccines already exist.
- Usually done right after a child is registered, or when adding new vaccines later.

What to input:

- Select one or more vaccines for the child

Backend action:

- `POST /records/generate/by-vaccines`

What the system creates:

- Immunization records for the selected child based on vaccine schedules
- These records are usually pending until attached to an actual visit

This is the key connection:

- `Child + Vaccine schedules = Immunization Records`

### Step 8: Create a clinic visit

Screen:

- `src/app/admin/visits/page.tsx`

Modal:

- `src/components/modal/UpsertVisitModal.tsx`

When to enter data:

- When an actual immunization appointment or visit happens.

What to input:

- Visit date
- Location
- Nurse / assigned user
- Child selection for new visit

Backend actions:

- Create visit: `POST /visits/createVisit`
- Update visit: `PUT /visits/updateVisit/:visitId`

What this means in workflow:

- A visit is the real encounter at the health center.
- It does not fully complete the immunization process until records are attached to it.

### Step 9: Attach pending immunization records to the visit

Screen:

- `src/app/admin/visits/page.tsx`

Modal:

- `src/components/modal/AttachRecordsModal.tsx`

When to enter data:

- Right after creating the visit, or later when finalizing what happened during that visit.

What to input:

- Select pending records for that child
- Choose final status

Allowed statuses in the modal:

- Completed
- Skipped
- Cancelled

Important rule:

- Pending records are loaded first, then attached to the visit.
- The modal intentionally does not attach records as `PENDING`.

Backend action:

- `POST /visits/attachRecordsToVisit`

What this step does:

- Links the immunization record to a real visit
- Updates the record status
- Makes the record part of visit history

This is the most important operational step in the system.

### Step 10: Review immunization records

Screen:

- `src/app/admin/immunization/page.tsx`

When to review:

- After records have been generated and attached to visits

What the admin can do here:

- Search records
- Filter by status
- View which child and vaccine each record belongs to
- Open linked visit details
- Review date given, nurse, batch number, manufacturer, and remarks if available from backend

This screen is the main monitoring page for immunization progress.

### Step 11: Monitor parents and children

Screens:

- `src/app/admin/parents/page.tsx`
- `src/app/admin/children/page.tsx`
- `src/app/admin/dashboard/page.tsx`

Use these screens to:

- Confirm parent-child linkage
- Confirm record generation
- Confirm visit linkage
- Monitor overall system activity

### Step 12: Post announcements if needed

Screen:

- `src/app/admin/announcement/page.tsx`

Modal:

- `src/components/modal/UpsertAnnouncementModal.tsx`

When to enter data:

- Any time the health center needs to publish a notice

What to input:

- Announcement title
- Announcement content
- Published status depending on backend behavior

Why this matters:

- Parents can read announcements in their portal.

## 5. Parent flow from start to end

### Step 13: Parent logs in

Layout and guards:

- `src/app/user/layout.tsx`
- `src/components/guards/ParentGuard.tsx`

What happens:

1. Parent logs in with their account.
2. System validates session and role.
3. Parent is allowed to access only the parent area.

### Step 14: Parent views dashboard

Screen:

- `src/app/user/dashboard/page.tsx`

Purpose:

- Show summary cards and child-related immunization overview pulled from backend data

### Step 15: Parent views children and records

Screen:

- `src/app/user/children/page.tsx`

What parent can do:

1. See all children linked to their account
2. Expand a child
3. View immunization records for that child
4. See record status such as pending, completed, skipped, or cancelled
5. See due dates, late flags, or missed indicators if returned by backend

This screen is the main parent-facing result of the admin workflow.

### Step 16: Parent reads announcements

Screen:

- `src/app/user/announcements/page.tsx`

What parent can do:

- Read announcements created by admin

### Step 17: Parent views profile

Screen:

- `src/app/user/profile/page.tsx`

What parent can do:

- Review account details
- Log out

## 6. Best step-by-step data entry order

If you want the cleanest setup flow, use this order every time:

1. Create roles
2. Create users
3. Confirm parent account exists
4. Register child under parent
5. Create vaccines and vaccine schedules
6. Generate vaccine records for the child
7. Create an actual visit
8. Attach pending records to that visit
9. Review record status in Immunization Records
10. Let parent view the updated records in the parent portal

## 7. Quick example of one complete real case

Example:

1. Admin creates a parent user named Maria Santos.
2. Admin registers Maria’s child, John Santos.
3. Admin creates vaccine templates like BCG, Pentavalent, and MMR with schedules.
4. Admin opens John’s child record and generates vaccine records for BCG and Pentavalent.
5. The system creates pending immunization records for John.
6. John visits the clinic on March 10, 2026.
7. Admin creates a visit for John with the date, location, and nurse.
8. Admin attaches John’s pending BCG record to that visit and marks it as completed.
9. The visit now contains that immunization record.
10. The record appears in admin immunization monitoring.
11. Maria logs in and sees John’s updated immunization status in the parent portal.

## 8. Summary of when data should be entered

- Enter `Role` data when setting permissions.
- Enter `User` data when creating accounts.
- Enter `Child` data after the parent exists.
- Enter `Vaccine` and `Schedule` data before record generation.
- Enter `Generate Vaccine Record` data after child and vaccine setup.
- Enter `Visit` data when the clinic encounter actually happens.
- Enter `Attach Record` data when finalizing what vaccines were handled during that visit.
- Enter `Announcement` data whenever the health center needs to notify parents.

## 9. One-line flow

Login -> Role/User setup -> Parent setup -> Child registration -> Vaccine setup -> Generate child records -> Create visit -> Attach records to visit -> Review records -> Parent views results
