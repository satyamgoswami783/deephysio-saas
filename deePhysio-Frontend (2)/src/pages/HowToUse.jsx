import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBookOpen, FaClinicMedical, FaDoorOpen, FaPercentage,
  FaUsers, FaWhatsapp, FaUserPlus, FaCalendarAlt,
  FaNotesMedical, FaFileInvoice, FaPrint, FaArrowRight,
  FaCheckCircle, FaSearch, FaLightbulb, FaCheck, FaLanguage
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';

const STEPS_DATA = [
  {
    step: 1,
    id: 'clinic-profile',
    route: '/settings/clinic',
    icon: <FaClinicMedical className="text-blue-500" />,
    btnText: { en: 'Open Clinic Profile', hi: 'क्लिनिक प्रोफ़ाइल खोलें' },
    badge: { en: 'Step 1 • Master Setup', hi: 'स्टेप 1 • मास्टर सेटअप' },
    title: {
      en: 'Clinic Profile & Invoice Logo Setup',
      hi: 'क्लिनिक प्रोफ़ाइल और चालान लोगो सेटअप'
    },
    definition: {
      en: 'Configure your clinic identity: Official Clinic Name, Address, Contact Phone, Email, Tax/GST registration number, and Invoicing Logo. This logo prints on all receipts and invoices.',
      hi: 'अपने क्लिनिक की पहचान कॉन्फ़िगर करें: Clinic Name, Address, Phone, Email, GST/Tax नंबर और Logo. यह लोगो आपके हर बिल और रसीद पर प्रिंट होगा।'
    },
    why: {
      en: 'Patient bills and receipts cannot display your official branding until clinic details and logo are saved.',
      hi: 'जब तक क्लिनिक विवरण और लोगो अपलोड नहीं होंगे, इनवॉइस पर क्लिनिक का नाम और लोगो नहीं आ पाएगा।'
    },
    exactSteps: {
      en: [
        'Click "Settings" in the left sidebar and open "General Settings" (/settings/clinic).',
        'Enter Clinic Name, Tagline, Phone number, Email, and Physical Address.',
        'Enter Clinic Tax/GST identification number (if applicable).',
        'Upload your Clinic Logo file (PNG or JPG format).',
        'Click the "Save Settings" button at the bottom.'
      ],
      hi: [
        'बाएं साइडबार में "Settings" पर क्लिक करें और "General Settings" खोलें (/settings/clinic)।',
        'Clinic Name, Tagline, फ़ोन नंबर, ईमेल और पता दर्ज करें।',
        'क्लिनिक का Tax/GST नंबर भरें (यदि लागू हो)।',
        'क्लिनिक का लोगो (PNG या JPG फ़ाइल) अपलोड करें।',
        'नीचे दिए गए "Save Settings" बटन पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'Clinic profile is saved and your logo appears on the sidebar and printed invoices.',
      hi: 'क्लिनिक प्रोफ़ाइल सेव हो जाएगी और चालान पर क्लिनिक का लोगो दिखने लगेगा।'
    },
    nextStepText: {
      en: 'Step 2: Configure treatment rooms and cabins.',
      hi: 'स्टेप 2: क्लिनिक के ट्रीटमेंट रूम/केबिन सेटअप करें।'
    }
  },
  {
    step: 2,
    id: 'room-setup',
    route: '/settings/rooms',
    icon: <FaDoorOpen className="text-sky-500" />,
    btnText: { en: 'Configure Rooms', hi: 'रूम्स कॉन्फ़िगर करें' },
    badge: { en: 'Step 2 • Room Allocation', hi: 'स्टेप 2 • रूम आवंटन' },
    title: {
      en: 'Treatment Rooms / Cabins Setup',
      hi: 'ट्रीटमेंट रूम और केबिन सेटअप'
    },
    definition: {
      en: 'Define your physical therapy rooms or cubicles (e.g. Consulting Room 1, Physio Bay A, Electrotherapy Suite) where patients receive care.',
      hi: 'क्लिनिक के ट्रीटमेंट केबिन या रूम बनाएं (जैसे: Room 1, Physio Bay A) जहाँ मरीजों का इलाज होगा।'
    },
    why: {
      en: 'Assigning a room during booking prevents two therapists from scheduling patients into the same room at the same time.',
      hi: 'अपॉइंटमेंट बुक करते समय रूम चुनना जरूरी है ताकि एक ही रूम में एक ही समय पर दो मरीजों की डबल-बुकिंग न हो।'
    },
    exactSteps: {
      en: [
        'Go to "Settings" > "Room Settings" in the sidebar (/settings/rooms).',
        'Enter Room Name (e.g., "Consulting Room 1", "Rehab Bay A").',
        'Set Room Capacity (typically 1 patient per room).',
        'Click the "Add Room" button.',
        'Repeat for all treatment rooms in your clinic.'
      ],
      hi: [
        'साइडबार में "Settings" > "Room Settings" पर जाएं (/settings/rooms)।',
        'कमरे का नाम लिखें (जैसे: "Consulting Room 1", "Rehab Bay A")।',
        'कमरे की क्षमता (Capacity) 1 सेट करें।',
        '"Add Room" बटन पर क्लिक करें।',
        'क्लिनिक के सभी केबिन इसी तरह जोड़ लें।'
      ]
    },
    expectedResult: {
      en: 'Rooms appear in the room list and become selectable during appointment booking.',
      hi: 'कमरे लिस्ट में जुड़ जाएंगे और अपॉइंटमेंट बुकिंग ड्रॉपडाउन में दिखने लगेंगे।'
    },
    nextStepText: {
      en: 'Step 3: Set clinic regional currency and date formatting.',
      hi: 'स्टेप 3: क्लिनिक की मुद्रा (Currency) और समय सेट करें।'
    }
  },
  {
    step: 3,
    id: 'currency-setup',
    route: '/settings/currency',
    icon: <FaPercentage className="text-indigo-500" />,
    btnText: { en: 'Set Currency', hi: 'करेंसी सेट करें' },
    badge: { en: 'Step 3 • Localization', hi: 'स्टेप 3 • स्थानीयकरण' },
    title: {
      en: 'Currency & Regional Settings',
      hi: 'मुद्रा और क्षेत्रीय सेटिंग्स'
    },
    definition: {
      en: 'Choose your clinic primary currency symbol (₹ INR, $ USD, £ GBP, € EUR) and timezone so all bills and appointment times match your location.',
      hi: 'क्लिनिक की डिफ़ॉल्ट मुद्रा (जैसे ₹ INR, $ USD) और तारीख का प्रारूप चुनें ताकि सभी बिल सही मुद्रा में बनें।'
    },
    why: {
      en: 'Ensures financial ledgers, revenue stats, and patient bills display your local currency accurately.',
      hi: 'मुद्रा सेट न होने पर बिलों पर गलत सिंबल दिख सकता है।'
    },
    exactSteps: {
      en: [
        'Open "Settings" > "Currency & Regional" (/settings/currency).',
        'Select Currency Symbol and code (e.g. ₹ INR).',
        'Select preferred date formatting (DD/MM/YYYY).',
        'Click "Save Changes".'
      ],
      hi: [
        'साइडबार में "Settings" > "Currency & Regional" खोलें (/settings/currency)।',
        'मुद्रा सिंबल चुनें (जैसे भारत के लिए ₹)।',
        'तारीख का प्रारूप चुनें (DD/MM/YYYY)।',
        '"Save Changes" पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'All invoices, payment screens, and dashboard metrics update to the selected currency symbol.',
      hi: 'सभी इनवॉइस, भुगतान और डैशबोर्ड में चुनी हुई मुद्रा लागू हो जाएगी।'
    },
    nextStepText: {
      en: 'Step 4: Create treatments and service price lists.',
      hi: 'स्टेप 4: क्लिनिक की सेवाओं और फीस की सूची जोड़ें।'
    }
  },
  {
    step: 4,
    id: 'services-pricing',
    route: '/billing/pricing',
    icon: <FaPercentage className="text-teal-500" />,
    btnText: { en: 'Add Services & Pricing', hi: 'सेवाएं और फीस जोड़ें' },
    badge: { en: 'Step 4 • Price List', hi: 'स्टेप 4 • मूल्य सूची' },
    title: {
      en: 'Services, Treatments & Price List',
      hi: 'सेवाएं, उपचार और मूल्य सूची'
    },
    definition: {
      en: 'Configure clinic therapy procedures and fees (e.g. Initial Assessment - ₹800, Manual Therapy - ₹1200, Dry Needling - ₹1500) with session durations.',
      hi: 'क्लिनिक में दी जाने वाली सभी फिजियोथेरेपी सेवाओं और उनकी फीस को जोड़ें (जैसे: परामर्श - ₹800, मैनुअल थेरेपी - ₹1200)।'
    },
    why: {
      en: 'Selecting a service during appointment booking or invoicing automatically fills in duration and price without typing.',
      hi: 'अपॉइंटमेंट बुक करते समय या बिल बनाते समय सर्विस चुनते ही फीस और समय अपने आप भर जाता है।'
    },
    exactSteps: {
      en: [
        'Open "Billing" > "Pricing / Services" (/billing/pricing).',
        'Click the "+ Add Service" button.',
        'Enter Service Name (e.g. "Physiotherapy Session - 45 Mins").',
        'Enter Duration (e.g. 45 minutes) and Price (e.g. 1200).',
        'Select Category and click "Save Service".'
      ],
      hi: [
        'साइडबार में "Billing" > "Pricing / Services" खोलें (/billing/pricing)।',
        '"+ Add Service" बटन पर क्लिक करें।',
        'सेवा का नाम (Service Name) दर्ज करें।',
        'समय (Duration) और फीस (Price) भरें।',
        'कैटेगरी चुनें और "Save Service" पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'The service is saved and available in booking and invoicing dropdowns.',
      hi: 'सर्विस मास्टर लिस्ट में सेव हो जाएगी और बुकिंग तथा बिलिंग दोनों जगह दिखाई देगी।'
    },
    nextStepText: {
      en: 'Step 5: Create staff accounts and assign roles.',
      hi: 'स्टेप 5: क्लिनिक स्टाफ (डॉक्टर, रिसेप्शनिस्ट) के अकाउंट बनाएं।'
    }
  },
  {
    step: 5,
    id: 'staff-users',
    route: '/settings/users',
    icon: <FaUsers className="text-purple-500" />,
    btnText: { en: 'Manage Staff', hi: 'स्टाफ मैनेज करें' },
    badge: { en: 'Step 5 • Team Management', hi: 'स्टेप 5 • टीम प्रबंधन' },
    title: {
      en: 'Staff Accounts & Roles (Doctors & Receptionists)',
      hi: 'स्टाफ अकाउंट और अनुमतियाँ'
    },
    definition: {
      en: 'Create separate secure user logins for Doctors, Physiotherapists, Receptionists, and Cashiers with role-based access permissions.',
      hi: 'डॉक्टर, फिजियोथेरेपिस्ट, रिसेप्शनिस्ट और कैशियर के लिए अलग लॉगिन अकाउंट बनाएं और भूमिकाएं निर्धारित करें।'
    },
    why: {
      en: 'Doctors see only clinical notes, receptionists handle appointments, and confidential clinic revenue stays protected.',
      hi: 'डॉक्टर को सिर्फ मरीज के मेडिकल नोट्स दिखेंगे, रिसेप्शनिस्ट चेक-इन कर सकेगी और वित्तीय डेटा सुरक्षित रहेगा।'
    },
    exactSteps: {
      en: [
        'Open "Settings" > "User Management" (/settings/users).',
        'Click the "+ Add User" button.',
        'Enter Staff Name, Email address, and secure Password.',
        'Select Role: "therapist" (Doctors), "receptionist" (Front Desk), or "billing" (Cashier).',
        'Click "Create User".'
      ],
      hi: [
        'साइडबार में "Settings" > "User Management" खोलें (/settings/users)।',
        '"+ Add User" बटन पर क्लिक करें।',
        'स्टाफ का नाम, ईमेल और सुरक्षित पासवर्ड दर्ज करें।',
        'रोल चुनें: डॉक्टर के लिए "therapist", फ्रंट डेस्क के लिए "receptionist", कैशियर के लिए "billing"।',
        '"Create User" पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'Staff member account is created; they can log in and access only their authorized modules.',
      hi: 'स्टाफ का लॉगिन बन जाएगा और वे अपने ईमेल/पासवर्ड से लॉगिन कर सकेंगे।'
    },
    nextStepText: {
      en: 'Step 6: Connect clinic WhatsApp for automated appointment alerts.',
      hi: 'स्टेप 6: ऑटोमैटिक अलर्ट के लिए क्लिनिक का WhatsApp जोड़ें।'
    }
  },
  {
    step: 6,
    id: 'whatsapp-setup',
    route: '/settings/whatsapp',
    icon: <FaWhatsapp className="text-emerald-500" />,
    btnText: { en: 'Connect WhatsApp', hi: 'व्हाट्सएप कनेक्ट करें' },
    badge: { en: 'Step 6 • Automation', hi: 'स्टेप 6 • ऑटोमेशन' },
    title: {
      en: 'Connect Clinic WhatsApp (Auto-Reminders)',
      hi: 'क्लिनिक का व्हाट्सएप लिंक करें'
    },
    definition: {
      en: 'Link your clinic WhatsApp phone by scanning the QR code to send automated appointment confirmations and reminder messages.',
      hi: 'क्लिनिक के फ़ोन का व्हाट्सएप QR कोड स्कैन करके सिस्टम से जोड़ें ताकि मरीजों को ऑटोमैटिक अपॉइंटमेंट मैसेज जाएं।'
    },
    why: {
      en: 'Patients receive instant booking confirmations and 24-hr advance reminders, significantly reducing clinic no-shows.',
      hi: 'मरीजों को तुरंत बुकिंग कन्फर्मेशन और रिमाइंडर व्हाट्सएप मैसेज मिलता है, जिससे मरीज समय पर क्लिनिक पहुंचते हैं।'
    },
    exactSteps: {
      en: [
        'Go to "Settings" > "WhatsApp Connectivity" (/settings/whatsapp).',
        'Enter Clinic Phone Number with country code (+91 9876543210).',
        'Click "Connect" -> A live QR Code will appear on your screen.',
        'Open WhatsApp on phone > Settings (or 3 dots) > "Linked Devices" > "Link a Device".',
        'Scan the QR code displayed on your screen.',
        'Status turns green: "CONNECTED".'
      ],
      hi: [
        'साइडबार में "Settings" > "WhatsApp Connectivity" पर जाएं (/settings/whatsapp)।',
        'क्लिनिक का फ़ोन नंबर कंट्री कोड के साथ (+91 9876543210) दर्ज करें।',
        '"Connect" बटन दबाएं -> स्क्रीन पर लाइव QR कोड दिखेगा।',
        'फ़ोन में व्हाट्सएप खोलें > सेटिंग्स (3 डॉट्स) > "Linked Devices" > "Link a Device" चुनें।',
        'स्क्रीन पर दिख रहे QR कोड को फ़ोन से स्कैन करें।',
        'स्टेटस हरा हो जाएगा: "CONNECTED"।'
      ]
    },
    expectedResult: {
      en: 'WhatsApp pairs successfully. Click "Send Test Message" to verify delivery.',
      hi: 'व्हाट्सएप सफलतापूर्वक जुड़ जाएगा और टेस्ट मैसेज भेजकर जांच कर सकते हैं।'
    },
    nextStepText: {
      en: 'Step 7: Register your first patient in the clinic.',
      hi: 'स्टेप 7: क्लिनिक में नए मरीज का रजिस्ट्रेशन करें।'
    }
  },
  {
    step: 7,
    id: 'patient-registration',
    route: '/patients/add',
    icon: <FaUserPlus className="text-indigo-500" />,
    btnText: { en: 'Register Patient', hi: 'मरीज रजिस्टर करें' },
    badge: { en: 'Step 7 • Patient Intake', hi: 'स्टेप 7 • मरीज का पंजीकरण' },
    title: {
      en: 'Register New Patient (EHR & Medical History)',
      hi: 'नया मरीज रजिस्टर करें (Patient EHR)'
    },
    definition: {
      en: 'Create a digital Electronic Health Record (EHR) profile with contact details, emergency contact, and medical alerts.',
      hi: 'मरीज की निजी जानकारी, मोबाइल नंबर, इमरजेंसी संपर्क और पुरानी बीमारी/सर्जरी का डिजिटल मेडिकल रिकॉर्ड बनाएं।'
    },
    why: {
      en: 'Patients must exist in the database before they can be scheduled on the calendar, diagnosed with SOAP notes, or invoiced.',
      hi: 'मरीज का रजिस्ट्रेशन किए बिना न अपॉइंटमेंट बुक हो सकती है, न डॉक्टर के नोट्स लिखे जा सकते हैं और न बिल बन सकता है।'
    },
    exactSteps: {
      en: [
        'Open "Patients" > "Add Patient" (/patients/add).',
        'Enter First Name, Last Name, Phone Number with country code, and Email.',
        'Select Gender, Date of Birth, and Patient Type (Normal, VIP, Athlete).',
        'Enter Emergency Contact Name and Phone.',
        'Record Pre-existing Medical History (Allergies, Surgeries, Chronic Conditions).',
        'Click "Save Patient".'
      ],
      hi: [
        'साइडबार में "Patients" > "Add Patient" पर क्लिक करें (/patients/add)।',
        'मरीज का नाम, फ़ोन नंबर (+91...) और ईमेल भरें।',
        'जेंडर, जन्म तिथि और मरीज का प्रकार (Normal, VIP, Athlete) चुनें।',
        'इमरजेंसी कॉन्टैक्ट का नाम और फ़ोन नंबर दर्ज करें।',
        'मेडिकल हिस्ट्री भरें (जैसे एलर्जी, पुरानी बीमारी या सर्जरी)।',
        '"Save Patient" बटन पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'Patient 360° EHR profile is generated, linking all future appointments, notes, and bills.',
      hi: 'मरीज का 360° प्रोफ़ाइल बन जाएगा जिसमें उनके अपॉइंटमेंट्स, नोट्स और बिल जुड़ेंगे।'
    },
    nextStepText: {
      en: 'Step 8: Schedule an appointment for this patient.',
      hi: 'स्टेप 8: मरीज के लिए अपॉइंटमेंट बुक करें।'
    }
  },
  {
    step: 8,
    id: 'appointment-booking',
    route: '/appointments/book',
    icon: <FaCalendarAlt className="text-sky-500" />,
    btnText: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
    badge: { en: 'Step 8 • Scheduling', hi: 'स्टेप 8 • शेड्यूलिंग' },
    title: {
      en: 'Book an Appointment on the Calendar',
      hi: 'कैलेंडर पर अपॉइंटमेंट बुक करें'
    },
    definition: {
      en: 'Schedule a patient visit by selecting their treatment service, treating therapist, room, and available time slot.',
      hi: 'मरीज के लिए डॉक्टर, थेरेपी सर्विस, रूम और समय का स्लॉट चुनकर अपॉइंटमेंट तय करें।'
    },
    why: {
      en: 'Locks the therapist and room on the calendar, and sends an automated WhatsApp confirmation to the patient.',
      hi: 'कैलेंडर पर अपॉइंटमेंट लॉक हो जाती है, रूम बुक हो जाता है और मरीज को व्हाट्सएप कन्फर्मेशन चला जाता है।'
    },
    exactSteps: {
      en: [
        'Open "Appointments" > "Book Appointment" (/appointments/book).',
        'Step 1: Search and select the registered Patient.',
        'Step 2: Select Treatment Service (duration and price load automatically).',
        'Step 3: Select assigned Therapist / Doctor.',
        'Step 4: Select Treatment Room / Cabin.',
        'Step 5: Pick the Date and click an open green Time Slot.',
        'Click "Confirm Booking".'
      ],
      hi: [
        'साइडबार में "Appointments" > "Book Appointment" खोलें (/appointments/book)।',
        'स्टेप 1: मरीज का नाम या फ़ोन नंबर सर्च करके चुनें।',
        'स्टेप 2: सर्विस (ट्रीटमेंट) चुनें (फीस और समय अपने आप आ जाएगा)।',
        'स्टेप 3: डॉक्टर / फिजियोथेरेपिस्ट का चुनाव करें।',
        'स्टेप 4: कमरा (Room/Cabin) चुनें।',
        'स्टेप 5: तारीख चुनें और हरे रंग के खाली टाइम स्लॉट पर क्लिक करें।',
        '"Confirm Booking" पर क्लिक करें।'
      ]
    },
    expectedResult: {
      en: 'The appointment appears on the calendar and automated WhatsApp confirmation is dispatched.',
      hi: 'कैलेंडर पर अपॉइंटमेंट तय हो जाएगी और मरीज के व्हाट्सएप पर बुकिंग मैसेज पहुंच जाएगा।'
    },
    nextStepText: {
      en: 'Step 9: Front-desk check-in upon arrival and clinical SOAP charting.',
      hi: 'स्टेप 9: मरीज के क्लिनिक आने पर चेक-इन करें और डॉक्टर SOAP नोट्स लिखें।'
    }
  },
  {
    step: 9,
    id: 'checkin-soap',
    route: '/appointments/checkin',
    icon: <FaNotesMedical className="text-cyan-500" />,
    btnText: { en: 'Open Check-in Desk', hi: 'चेक-इन डेस्क खोलें' },
    badge: { en: 'Step 9 • Clinical Workflow', hi: 'स्टेप 9 • क्लिनिकल वर्कफ़्लो' },
    title: {
      en: 'Front-Desk Check-in & Doctor SOAP Notes',
      hi: 'रिसेप्शन चेक-इन और डॉक्टर SOAP नोट्स'
    },
    definition: {
      en: 'Reception marks arriving patients as "Checked In". The doctor conducts the treatment and records SOAP notes (Subjective, Objective, Assessment, Plan).',
      hi: 'मरीज के आने पर रिसेप्शन उन्हें "Checked In" मार्क करे और डॉक्टर केबिन में उनका इलाज करके SOAP नोट लिखें।'
    },
    why: {
      en: 'Notifies therapists in real time that their patient has arrived and maintains legal clinical treatment records.',
      hi: 'डॉक्टर को तुरंत पता चलता है कि मरीज आ चुका है और इलाज के बाद कानूनी व मेडिकल रिकॉर्ड तैयार होता है।'
    },
    exactSteps: {
      en: [
        'Front Desk: Open "Appointments" > "Check-in" (/appointments/checkin).',
        'Click the green "Check In" button next to patient name -> Moves to Waiting Area queue.',
        'Doctor / Therapist: Open "Clinical Notes" > "New Note" (/notes/new).',
        'Select Patient & Appointment; choose Note Type: "SOAP Note".',
        'Enter [S] Subjective (pain score 1-10), [O] Objective (ROM, strength), [A] Assessment, and [P] Plan (Treatment & Home Exercises).',
        'Click "Finalize Note" to lock the medical record.'
      ],
      hi: [
        'फ्रंट डेस्क: साइडबार में "Appointments" > "Check-in" खोलें (/appointments/checkin)।',
        'मरीज के नाम के आगे हरा "Check In" बटन दबाएं -> मरीज वेटिंग एरिया में चला जाएगा।',
        'डॉक्टर: "Clinical Notes" > "New Note" खोलें (/notes/new)।',
        'मरीज और अपॉइंटमेंट चुनें, Note Type: "SOAP Note" चुनें।',
        '[S] Subjective (दर्द का स्तर), [O] Objective (मूवमेंट), [A] Assessment (जांच), और [P] Plan (दिया गया इलाज) लिखें।',
        '"Finalize Note" बटन दबाकर नोट सेव करें।'
      ]
    },
    expectedResult: {
      en: 'Patient arrival timestamp is logged and SOAP notes are permanently attached to the chart.',
      hi: 'मरीज का चेक-इन और पूरा मेडिकल SOAP नोट सुरक्षित रूप से सेव हो जाता है।'
    },
    nextStepText: {
      en: 'Step 10: Generate invoice and collect session payment.',
      hi: 'स्टेप 10: इलाज का बिल बनाएं और फीस कलेक्ट करें।'
    }
  },
  {
    step: 10,
    id: 'billing-payment',
    route: '/billing',
    icon: <FaFileInvoice className="text-emerald-500" />,
    btnText: { en: 'Open Billing', hi: 'बिलिंग खोलें' },
    badge: { en: 'Step 10 • Billing & Cash', hi: 'स्टेप 10 • बिलिंग और रसीद' },
    title: {
      en: 'Generate Invoice & Record Payment Receipt',
      hi: 'बिल (Invoice) बनाएं और फीस कलेक्ट करें'
    },
    definition: {
      en: 'Create a sequential tax invoice for completed treatments, collect payment via Cash, UPI/GPay, Card, or Bank, and print a branded receipt.',
      hi: 'दिए गए इलाज का पक्का बिल बनाएं, Cash/UPI/Card से फीस लें और क्लिनिक के लोगो वाली पक्की रसीद प्रिंट करें।'
    },
    why: {
      en: 'Tracks clinic revenue, eliminates unpaid dues, and provides patients with an official stamped invoice for medical reimbursement.',
      hi: 'क्लिनिक की कमाई का पूरा हिसाब रहता है, बकाया फीस ट्रैक होती है और मरीज को क्लेम के लिए पक्की रसीद मिलती है।'
    },
    exactSteps: {
      en: [
        'Open "Billing" and click "+ New Invoice" (/billing/new).',
        'Select Patient -> Add completed treatment service item.',
        'Apply any Discount or Tax % (Total calculates automatically).',
        'Click "Create Invoice" -> System generates sequential number (e.g. INV-1001).',
        'Click "Record Payment" on the invoice screen.',
        'Select Payment Method: Cash, UPI / GooglePay / PhonePe, Credit Card, or Bank Transfer.',
        'Enter Amount Paid and click "Save Payment" -> Status updates to PAID.',
        'Click "Print Invoice" to print or download the official receipt with your logo.'
      ],
      hi: [
        'साइडबार में "Billing" खोलें और "+ New Invoice" बटन दबाएं (/billing/new)।',
        'मरीज चुनें -> दी गई सर्विस (इलाज) जोड़ें।',
        'छूट (Discount) या टैक्स लगाएं (कुल राशि अपने आप बन जाएगी)।',
        '"Create Invoice" दबाएं -> इनवॉइस नंबर जनरेट हो जाएगा (जैसे INV-1001)।',
        'स्क्रीन पर "Record Payment" बटन दबाएं।',
        'भुगतान का तरीका चुनें (Cash, UPI/GooglePay, कार्ड या बैंक ट्रांसफर)।',
        'मिली हुई रकम दर्ज करें और "Save Payment" दबाएं -> स्टेटस PAID हो जाएगा।',
        '"Print Invoice" दबाकर क्लिनिक लोगो वाली रसीद प्रिंट कर लें।'
      ]
    },
    expectedResult: {
      en: 'Payment is posted to the clinic revenue ledger and the patient receives a stamped payment receipt.',
      hi: 'पेमेंट क्लिनिक के खाते में जुड़ जाएगी और मरीज को पक्की रसीद मिल जाएगी।'
    },
    nextStepText: {
      en: 'Your complete clinic workflow is finished! View financial summaries on your Dashboard (/dashboard).',
      hi: 'आपका पूरा क्लिनिक फ्लो पूरा हो गया! अब डैशबोर्ड (/dashboard) पर जाकर रोजाना की कमाई और रिपोर्ट देखें।'
    }
  }
];

const HowToUse = () => {
  const navigate = useNavigate();
  const { currentLang, setLanguage } = useLanguage();

  // Selected display language: 'hi' or 'en' (syncs with currentLang)
  const [lang, setLang] = useState(currentLang === 'hi' ? 'hi' : 'en');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentLang === 'hi') {
      setLang('hi');
    } else {
      setLang('en');
    }
  }, [currentLang]);

  const handleLanguageSwitch = (newLang) => {
    setLang(newLang);
    if (setLanguage) {
      setLanguage(newLang);
    }
  };

  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('deephysio_quick_steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheck = (stepId) => {
    setCompletedSteps(prev => {
      const updated = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem('deephysio_quick_steps', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const filteredSteps = STEPS_DATA.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleText = (s.title[lang] || s.title.en).toLowerCase();
    const defText = (s.definition[lang] || s.definition.en).toLowerCase();
    const stepsText = (s.exactSteps[lang] || s.exactSteps.en).join(' ').toLowerCase();
    return titleText.includes(q) || defText.includes(q) || stepsText.includes(q);
  });

  const completedCount = STEPS_DATA.filter(s => completedSteps[s.id]).length;
  const progressPercent = Math.round((completedCount / STEPS_DATA.length) * 100);

  const isHindi = lang === 'hi';

  return (
    <div className="space-y-6 animate-fade-in custom-scrollbar p-2 sm:p-4 md:p-6 min-h-[calc(100vh-80px)]">
      {/* ── HEADER ── */}
      <PageHeader
        title={isHindi ? "सॉफ़्टवेयर कैसे इस्तेमाल करें (कदम-दर-कदम गाइड)" : "How to Use Software (Step-by-Step Practical Guide)"}
        subtitle={isHindi ? "क्लिनिक सेटअप से लेकर मरीज पंजीकरण, अपॉइंटमेंट, SOAP नोट्स और बिलिंग तक का पूरा वर्कफ़्लो" : "Complete end-to-end workflow from Clinic Setup to Patient Intake, Booking, SOAP Notes, and Invoicing"}
        icon={<FaBookOpen className="text-amber-500" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Language Switcher Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleLanguageSwitch('en')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !isHindi ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isHindi ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<FaPrint />}
              onClick={() => window.print()}
              className="cursor-pointer font-bold shadow-xs hover:border-slate-300"
            >
              {isHindi ? "गाइड प्रिंट करें" : "Print Guide"}
            </Button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5">
              <FaCheckCircle className="text-emerald-600" />
              <span>{completedCount} / 10 {isHindi ? "पूरे हुए" : "Completed"} ({progressPercent}%)</span>
            </div>
          </div>
        }
      />

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wider uppercase text-amber-300 mb-3">
            <FaLightbulb />
            DeePhysio SaaS • {isHindi ? "सरल ऑपरेटिंग गाइड" : "Operating Playbook"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
            {isHindi ? "सॉफ़्टवेयर को शुरू से आखिर तक इस्तेमाल करने का आसान तरीका" : "The Clean Step-by-Step Way to Operate Your Clinic"}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            {isHindi 
              ? "नीचे दिए गए 10 चरणों को क्रम से फॉलो करें। हर चरण में स्पष्ट परिभाषा है कि क्या करना है, क्यों करना है, कौन सा बटन दबाना है, और अगला चरण क्या है।"
              : "Follow these 10 verified steps in sequence. Each step clearly explains what to do, why it is necessary, exact buttons to click, and the expected result."}
          </p>

          {/* Quick Search */}
          <div className="relative max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? "सर्च करें (उदा: WhatsApp, बिलिंग, बुकिंग, SOAP नोट, मरीज, रूम)..." : "Search step (e.g. WhatsApp, billing, booking, SOAP note, patient, rooms)..."}
              className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-slate-400 rounded-2xl border border-white/20 focus:border-white focus:outline-none transition-all text-xs font-semibold backdrop-blur-md shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white px-2 py-1"
              >
                {isHindi ? "हटाएं" : "Clear"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {isHindi ? "क्लिनिक ऑनबोर्डिंग प्रगति" : "Clinic Onboarding Progress"}
          </span>
          <h4 className="text-base font-black text-slate-900">
            {completedCount} of 10 {isHindi ? "चरण पूरे हुए" : "Steps Completed"}
          </h4>
        </div>
        <div className="flex-1 max-w-md">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-black text-slate-900">{progressPercent}% {isHindi ? "तैयार" : "Ready"}</span>
      </div>

      {/* ── 10 CLEAR STEP-BY-STEP CARDS ── */}
      <div className="space-y-6">
        {filteredSteps.map((s) => {
          const isDone = !!completedSteps[s.id];
          const title = s.title[lang] || s.title.en;
          const badge = s.badge[lang] || s.badge.en;
          const definition = s.definition[lang] || s.definition.en;
          const why = s.why[lang] || s.why.en;
          const exactSteps = s.exactSteps[lang] || s.exactSteps.en;
          const expectedResult = s.expectedResult[lang] || s.expectedResult.en;
          const nextStepText = s.nextStepText[lang] || s.nextStepText.en;
          const btnText = s.btnText[lang] || s.btnText.en;

          return (
            <div
              key={s.id}
              className={`rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 shadow-sm hover:shadow-md bg-white ${
                isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {badge}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {isHindi ? "पूर्ण ✓" : "Done ✓"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {s.step}. {title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleCheck(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDone
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FaCheck size={11} />
                    <span>{isDone ? (isHindi ? "पूर्ण" : "Completed") : (isHindi ? "पूर्ण मार्क करें" : "Mark as Done")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(s.route)}
                    className="px-4 py-2 bg-slate-900 hover:bg-clinicPrimary text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{btnText}</span>
                    <FaArrowRight size={10} />
                  </button>
                </div>
              </div>

              {/* Definition & Why Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] block mb-1 text-blue-600">
                    {isHindi ? "📖 परिभाषा (यह क्या है?):" : "📖 Definition (What is this?):"}
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{definition}</p>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                  <span className="font-black uppercase tracking-wider text-[10px] block mb-1 text-amber-900">
                    {isHindi ? "💡 यह करना क्यों जरूरी है?" : "💡 Why is this step essential?"}
                  </span>
                  <p className="text-amber-950 leading-relaxed font-medium">{why}</p>
                </div>
              </div>

              {/* Exact How-to Steps */}
              <div className="mt-5">
                <span className="font-black text-slate-900 uppercase tracking-wider text-xs block mb-3">
                  {isHindi ? "🛠️ इस्तेमाल करने का सटीक तरीका (कदम-दर-कदम):" : "🛠️ How to Perform This (Step-by-Step Instructions):"}
                </span>
                <div className="space-y-2">
                  {exactSteps.map((stepInstruction, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-start gap-3 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">{stepInstruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Result & Next Step Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-emerald-800 flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-600 shrink-0" />
                  <span>
                    <strong className="font-black">{isHindi ? "परिणाम (Result):" : "Result:"}</strong> {expectedResult}
                  </span>
                </div>
                <div className="text-blue-700 flex items-center gap-1.5 font-bold shrink-0">
                  <span>{isHindi ? "अगला कदम:" : "Next Step:"} {nextStepText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HowToUse;
