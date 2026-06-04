# TrustPaws — Instruction Manual

> A complete step-by-step guide for grooming staff and pet parents.

**Live app → [smritireddyy.github.io/trustpaws](https://smritireddyy.github.io/trustpaws)**

---

## Table of Contents

### For Staff
1. [Logging In](#1-logging-in-staff)
2. [The Dashboard](#2-the-dashboard)
3. [Appointments List](#3-appointments-list)
4. [Creating an Appointment](#4-creating-an-appointment)
5. [Managing an Appointment](#5-managing-an-appointment)
6. [Completing a Service](#6-completing-a-service)
7. [Logging an Incident](#7-logging-an-incident)
8. [Sharing the Tracking Link](#8-sharing-the-tracking-link)
9. [Live Monitor](#9-live-monitor)
10. [Managing Pets](#10-managing-pets)
11. [Managing Pet Parents & Setting PINs](#11-managing-pet-parents--setting-pins)

### For Pet Parents
1. [Logging In](#1-logging-in-parent)
2. [Overview Tab](#2-overview-tab)
3. [Tracking Live Status](#3-tracking-live-status)
4. [History Tab](#4-history-tab)
5. [Clips Tab](#5-clips-tab)
6. [Noted Issues Tab](#6-noted-issues-tab)

---

# For Staff

## 1. Logging In (Staff)

Go to **[smritireddyy.github.io/trustpaws](https://smritireddyy.github.io/trustpaws)**.

You'll land on the **Staff Login** page.

![Staff Login](screenshots/staff-login.png)

- Enter your **email** (e.g. `groomer@huft.com`)
- Enter your **password**
- Click **Sign In**

> If you're a pet parent, click **Parent portal →** at the bottom to switch to the parent login page.

**Demo credentials:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@huft.com | admin123 |
| Staff | groomer@huft.com | staff123 |

---

## 2. The Dashboard

After logging in you'll land on the **Dashboard** — your daily command centre.

![Staff Dashboard](screenshots/staff-dashboard.png)

**What you see:**

| Card | What it means |
|---|---|
| **In Progress** | Appointments currently active (checked in or mid-groom) |
| **Ready Pickup** | Pets that are done and waiting to be collected |
| **Completed** | Fully finished appointments for today |
| **Incidents** | Number of incidents logged across today's appointments |

Below the cards, **Today's Appointments** lists every booking for today with the pet name, owner name, time, and live status badge. Click any row to open the full appointment.

> Use the **+ New** button (top right) to create a new appointment.

---

## 3. Appointments List

Click **Appointments** in the sidebar to see all appointments.

![Appointments List](screenshots/staff-appointments.png)

From here you can:
- **Search** by pet name or parent name
- **Filter by date** using the date picker
- **Filter by status** — All / Scheduled / Checked In / Bathing / Grooming / Drying / Ready / Completed
- Click any row to open that appointment's detail page
- Click **+ New** to create a new appointment

---

## 4. Creating an Appointment

Click **+ New** from the Dashboard or Appointments page.

Fill in the form:
- **Pet** — search and select an existing pet, or add a new one
- **Groomer** — assign a staff member
- **Date & Time** — when the appointment is scheduled
- **Services** — tick all services included in this session (Bath, Haircut, Nail Trim, Ear Cleaning, Teeth Brushing, etc.)
- **Notes** — any special instructions from the parent (e.g. "use hypoallergenic shampoo", "sensitive around ears")

Click **Create Appointment**.

The appointment is created instantly. A unique tracking link is automatically generated for the pet parent.

---

## 5. Managing an Appointment

Click any appointment to open the full detail page.

![Appointment Detail](screenshots/staff-appointment-detail.png)

**At the top** you'll see:
- Pet name, breed, age, weight
- Owner name and phone number
- **Monitor** button — opens the Live Monitor for this session
- **Share** button — copies the parent's tracking link to your clipboard

### Moving Through Stages

Use the **Update Status** section to move the appointment through the grooming pipeline:

```
Scheduled → Checked In → Bathing → Grooming → Drying → Ready → Completed
```

- Click **Move to [Next Stage]** to advance
- Click **Back** to go back a step if needed
- The **orange progress bar** shows how far along the appointment is at a glance

---

## 6. Completing a Service

As each service is finished, **tap its checkbox**. A completion form will pop up asking for two things:

**1. How did it go?**

| Option | When to use |
|---|---|
| ✅ Good | Everything went smoothly, no issues |
| ⚠️ Sensitive area noted | Something minor to flag — not an incident, but worth noting for the parent |
| 🔴 Needs attention | Something the parent should be aware of and discuss |

**2. Observations** *(optional)*

Add a free-text note for the parent, e.g.:
> *"Coat was matted near the collar area, carefully detangled."*
> *"Used hypoallergenic shampoo as requested."*
> *"Much more cooperative this time!"*

Click **Mark Complete**. The service is checked off with your notes attached — the parent can see this immediately on their live tracking page.

---

## 7. Logging an Incident

If anything happens during the session — **however minor** — it should be logged. TrustPaws is built on full transparency.

1. Scroll to the **Incidents** section on the appointment page
2. Click **Log Incident**
3. Fill in:
   - **Severity** — Low (minor, no harm) / Medium (needs attention) / High (serious)
   - **Title** — short description, e.g. *"Small nick during nail trim"*
   - **Description** — exactly what happened
   - **Action Taken** — what was done to resolve it, e.g. *"Applied styptic powder, monitored for 10 minutes"*
4. Click **Log Incident**

The incident is immediately visible to the parent under their **Noted Issues** tab.

> Even a LOW severity incident should be logged. Parents appreciate knowing everything — it builds trust.

---

## 8. Sharing the Tracking Link

Every appointment has a unique link that lets the parent follow along with no login required.

1. On the appointment detail page, click **Share**
2. The link is copied to your clipboard automatically
3. Send it via WhatsApp, SMS, or any messaging app

The parent can open it at any time to see the live status, completed services with groomer notes, any incidents, and photos.

---

## 9. Live Monitor

The Live Monitor uses your device's camera and microphone to detect signs of distress in real time.

![Live Monitor](screenshots/staff-monitor.png)

**How to use:**
1. On the appointment detail page, click **Monitor**
2. Click **Start Monitoring**
3. Allow camera and microphone access when your browser prompts you
4. The system watches and listens for:

| Signal | What it detects |
|---|---|
| 😣 Sudden yelp | Sharp amplitude spike in sound |
| 😢 Whimper / howl | Sustained high-frequency sound |
| ⚡ Sudden flinch | Rapid motion change in the frame |
| 🐾 Recoil movement | Large frame-difference spike |

5. If distress is detected, a **clip is automatically saved** and an alert banner appears
6. Click **Save Clip Now** at any time to manually save a clip
7. Click **Stop** when the session ends

Saved clips are stored on the server and shown to the parent in their **Clips** tab.

> The monitor runs entirely on your device — no special hardware needed, just a laptop or tablet with a camera.

---

## 10. Managing Pets

Click **Pets** in the sidebar to see all registered pets.

![Pets List](screenshots/staff-pets.png)

Each card shows:
- Pet name, breed, species
- Owner name
- Age and weight

Click any pet card to see their full profile — breed details, appointment history, notes, and any incidents across all past visits.

Click **+ Add Pet** to register a new pet (you'll also need to link them to a parent).

---

## 11. Managing Pet Parents & Setting PINs

Click **Pet Parents** in the sidebar to manage all parent accounts.

![Pet Parents List](screenshots/staff-pet-parents.png)

Each parent row shows:
- **Name, phone number, email**
- **PIN set** badge (green) — confirms the parent can log into their portal
- **Reset PIN** button — lets you set a new PIN at any time
- **X pet(s)** badge — how many pets are linked to this parent
- Pet name chips below — quick view of which pets belong to them

Use the **Search** bar to find a parent by name.

Click **+ Add Parent** to register a new parent — enter their name, phone number, and email.

### Setting a Parent's PIN

Parents log into the parent portal using their **phone number + PIN**. You must set their PIN before they can log in for the first time.

1. Click **Reset PIN** next to the parent's name
2. Enter a 4–8 digit PIN
3. Confirm and save

Give the parent their **phone number and PIN** — they can log in at [smritireddyy.github.io/trustpaws](https://smritireddyy.github.io/trustpaws) → Parent portal.

> If a parent forgets their PIN, click **Reset PIN** and give them a new one. Takes under 30 seconds.

---

# For Pet Parents

## 1. Logging In (Parent)

Go to **[smritireddyy.github.io/trustpaws](https://smritireddyy.github.io/trustpaws)** and click **Parent portal →** at the bottom of the page.

![Parent Login](screenshots/parent-login.png)

- Enter your **mobile number** (the one registered with the spa)
- Enter your **PIN** (set by the spa's front desk)
- Click **Sign In**

> Don't have a PIN? Ask the front desk — they can set one for you in under a minute.

**Demo parent accounts:**
| Name | Phone | PIN | Pet |
|---|---|---|---|
| Rahul Verma | 9999999999 | 1234 | Bruno (Labrador) |
| Meera Nair | 8888888888 | 1234 | Coco (Persian Cat) |
| Arjun Kapoor | 7777777777 | 1234 | Max (Golden Retriever) |

---

## 2. Overview Tab

After logging in you'll see the **Overview** tab — your home screen.

![Parent Overview](screenshots/parent-overview.png)

### Live Now
If your pet is currently being groomed, a **Live Now** banner appears at the top with the current stage (e.g. *Checked In*, *Bathing*) and a **See Live Status** button.

### Your Pets
Below that, a card for each of your pets shows:
- Breed and age
- Date of last visit
- Total number of completed visits
- An incident badge if any issues have been logged
- A list of the 3 most recent appointments — tap any to view the full report

---

## 3. Tracking Live Status

Tap **See Live Status** or open the shareable link the spa sent you.

This page shows:

- **Status timeline** — a visual pipeline showing which stage your pet is at right now
- **Services checklist** — each service checked off as it's completed, with the groomer's condition rating and notes
- **Groomer observations** — notes the groomer left after each service (e.g. *"Ears clear, no buildup"*)
- **Incidents** — if anything was logged, it shows here with full details and the action taken
- **Your groomer** — name of the staff member handling the session

The page **auto-refreshes every 30 seconds** — you don't need to do anything.

---

## 4. History Tab

Tap **History** to see a full record of all past visits across all your pets.

![Parent History](screenshots/parent-history.png)

**Summary row at the top:**
- **Total visits** — total completed appointments
- **Last visit** — how long ago
- **Top service** — your most frequently booked service

**Each visit card shows:**
- Pet name and date
- Session duration and groomer name
- Every service completed — with the groomer's condition rating and notes
- An incident badge if something was logged that visit — tap **View →** to go to Noted Issues

Tap **View full report →** on any visit to open the original tracking page for that appointment.

---

## 5. Clips Tab

Tap **Clips** to see any video clips recorded during your pet's sessions.

![Clips Tab](screenshots/parent-clips.png)

**What are clips?**
When the grooming team uses the Live Monitor during a session, the system listens and watches for signs of distress — sudden sounds, movement spikes. If anything is detected, a short clip is automatically saved. These are stored here for complete transparency.

If monitoring wasn't active during a session, or nothing unusual was detected, this tab shows **No clips yet** — which is a good sign!

---

## 6. Noted Issues Tab

Tap **Noted Issues** to see every incident logged by the grooming team.

![Noted Issues](screenshots/parent-noted-issues.png)

**Every incident shows:**
- Pet name and date/time it was logged
- **Severity badge** — Low / Medium / High
- What happened (full description)
- **Action taken** — exactly what the team did to address it
- A link to **View full appointment →**

> TrustPaws logs every incident, no matter how minor. This is intentional — full transparency is at the heart of what we do. The team will always discuss any logged issue with you at pickup.

---

## Quick Reference

### Staff Login
| Role | Email | Password |
|---|---|---|
| Admin | admin@huft.com | admin123 |
| Staff | groomer@huft.com | staff123 |

### Parent Login
| Name | Phone | PIN |
|---|---|---|
| Rahul Verma | 9999999999 | 1234 |
| Meera Nair | 8888888888 | 1234 |
| Arjun Kapoor | 7777777777 | 1234 |

### Appointment Status Flow
```
Scheduled → Checked In → Bathing → Grooming → Drying → Ready → Completed
```

### Service Condition Options (Staff)
| Rating | Meaning |
|---|---|
| ✅ Good | All fine |
| ⚠️ Sensitive area noted | Minor flag for parent awareness |
| 🔴 Needs attention | Parent should be informed and discuss |

---

*TrustPaws by Heads Up For Tails*
