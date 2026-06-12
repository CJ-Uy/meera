import type { KbNode } from "@/features/admin/types";

/**
 * Built-in knowledge base for AISIS Online (the Ateneo Integrated Student Information System).
 *
 * These are hand-written, step-by-step navigation guides authored from the real AISIS home page so
 * Meera can hand-hold a student through common tasks ("how do I see my class schedule?"). They are
 * merged into KB retrieval as static defaults (see knowledge.ts), so the assistant is grounded even
 * before anyone seeds the database. Admin-curated DB entries with the same id override these, and any
 * new DB entries are added on top — so this file is the editable source of truth for the AISIS guide.
 *
 * Editing tips:
 * - The `label` is what retrieval keyword-matches against the student's question — keep the task words
 *   ("class schedule", "tuition receipt", "syllabus") in it.
 * - The `body` is collapsed to a single line before it reaches the model, so write the steps inline
 *   ("1) ... 2) ... 3) ...") and keep each entry under ~600 characters.
 * - Name on-screen labels exactly as they appear (e.g. 'PRINT TUITION RECEIPT') so the visual overlay
 *   grounding can find and point at the right row.
 */
export const AISIS_KB_NODES: KbNode[] = [
	{
		id: "aisis-overview",
		dept: "shared",
		kind: "entity",
		label: "AISIS home page and Site Map overview",
		body:
			"After you sign in, AISIS shows the home page with the Site Map: a two-column table where the LEFT column is a clickable link (the page name) and the RIGHT column is a short description of that page. The Site Map links are: My Individual Program of Study, Print Tuition Receipt, Official Curriculum, Course and Faculty Evaluation, Update Student Information, My Currently Enrolled Classes, My Grades, My Hold Orders, Print SAA, My Class Schedule, Change Password, and Class Schedule. To do almost anything, start here and click the matching left-column link.",
		meta: { system: "AISIS", page: "Site Map" },
	},
	{
		id: "aisis-sign-in",
		dept: "shared",
		kind: "procedure",
		label: "How to sign in or log in to AISIS",
		body:
			"The AISIS login page has two input boxes: the first is your username and the second is your password. Type your username and password, then click Sign In to log in. Once signed in you land on the home page, which shows the Site Map of everything you can do.",
		meta: { system: "AISIS", page: "Login" },
	},
	{
		id: "aisis-print-tuition-receipt",
		dept: "shared",
		kind: "procedure",
		label: "How to print your tuition receipt in AISIS",
		body:
			"To print your tuition receipt: 1) On the home page Site Map, click the left-column link 'PRINT TUITION RECEIPT' (its description reads 'Print past and current tuition receipt'). 2) The receipt page opens with a single full-width dropdown field labeled 'Print Tuition Receipt for School Year'. 3) Click that dropdown and choose the semester / school year you want. 4) Your tuition receipt for that term then appears and can be printed.",
		meta: { system: "AISIS", page: "Print Tuition Receipt" },
	},
	{
		id: "aisis-view-syllabus",
		dept: "shared",
		kind: "procedure",
		label: "How to view your class syllabus (My Currently Enrolled Classes)",
		body:
			"To view a class syllabus: 1) On the home page Site Map, click the left-column link 'MY CURRENTLY ENROLLED CLASSES' (description: \"View your current semester subjects' syllabi\"). 2) A table of your enrolled subjects opens with columns: Subject Code, Section, Delivery Mode, Batch, Schedule, Course Title, Instructor, and Units. 3) The rightmost column of each subject's row has a 'View Class Syllabus' link. 4) Click that link to open the syllabus for that subject.",
		meta: { system: "AISIS", page: "My Currently Enrolled Classes" },
	},
	{
		id: "aisis-class-schedule",
		dept: "shared",
		kind: "procedure",
		label: "How to view and print your class schedule (your subject times)",
		body:
			"To see your class schedule and the times of your classes: 1) On the home page Site Map, click the left-column link 'MY CLASS SCHEDULE' (description: 'View and print your class schedule'). 2) AISIS opens a table showing your full schedule, including the day and time of each class. 3) You can print the schedule from this page.",
		meta: { system: "AISIS", page: "My Class Schedule" },
	},
	{
		id: "aisis-my-grades",
		dept: "shared",
		kind: "procedure",
		label: "How to view your grades in AISIS",
		body:
			"To view your grades: on the home page Site Map, click the left-column link 'MY GRADES' (description: 'View your grades from your freshman to current year'). It shows your grades from freshman year up to your current year.",
		meta: { system: "AISIS", page: "My Grades" },
	},
	{
		id: "aisis-hold-orders",
		dept: "shared",
		kind: "procedure",
		label: "How to check your hold orders in AISIS",
		body:
			"To check for hold orders: on the home page Site Map, click the left-column link 'MY HOLD ORDERS' (description: 'Find out if you have Hold Orders'). It tells you whether you currently have any Hold Orders.",
		meta: { system: "AISIS", page: "My Hold Orders" },
	},
	{
		id: "aisis-change-password",
		dept: "shared",
		kind: "procedure",
		label: "How to change your AISIS password",
		body:
			"To change your password: on the home page Site Map, click the left-column link 'CHANGE PASSWORD'. Enter a new password that is at least 8 characters long.",
		meta: { system: "AISIS", page: "Change Password" },
	},
	{
		id: "aisis-update-student-information",
		dept: "shared",
		kind: "procedure",
		label: "How to update your student contact information and address",
		body:
			"To update your contact details: on the home page Site Map, click the left-column link 'UPDATE STUDENT INFORMATION' (description: 'Update your contact information and addresses').",
		meta: { system: "AISIS", page: "Update Student Information" },
	},
	{
		id: "aisis-official-curriculum",
		dept: "shared",
		kind: "procedure",
		label: "How to view the official curriculum of a degree",
		body:
			"To view an official curriculum: on the home page Site Map, click the left-column link 'OFFICIAL CURRICULUM' (description: 'View the official curriculum of the different degrees').",
		meta: { system: "AISIS", page: "Official Curriculum" },
	},
	{
		id: "aisis-individual-program-of-study",
		dept: "shared",
		kind: "procedure",
		label: "How to track your progress (My Individual Program of Study)",
		body:
			"To track your academic progress: on the home page Site Map, click the left-column link 'MY INDIVIDUAL PROGRAM OF STUDY' (description: 'Track your progress').",
		meta: { system: "AISIS", page: "My Individual Program of Study" },
	},
	{
		id: "aisis-course-faculty-evaluation",
		dept: "shared",
		kind: "procedure",
		label: "How to evaluate your courses and faculty",
		body:
			"To evaluate your subjects and teachers: on the home page Site Map, click the left-column link 'COURSE AND FACULTY EVALUATION' (description: 'Evaluate your subjects and teachers').",
		meta: { system: "AISIS", page: "Course and Faculty Evaluation" },
	},
	{
		id: "aisis-print-saa",
		dept: "shared",
		kind: "procedure",
		label: "How to print your Student Accounts Adjustment (SAA)",
		body:
			"To print your Student Accounts Adjustment (SAA): on the home page Site Map, click the left-column link 'PRINT SAA' (description: 'Print Student Accounts Adjustment').",
		meta: { system: "AISIS", page: "Print SAA" },
	},
	{
		id: "aisis-class-offerings",
		dept: "shared",
		kind: "procedure",
		label: "How to view all classes being offered (course offerings)",
		body:
			"To see all classes being offered (not just your own): on the home page Site Map, click the left-column link 'CLASS SCHEDULE' (description: 'View the schedule of all classes being offered'). Note: this is different from 'MY CLASS SCHEDULE', which shows only your own enrolled schedule.",
		meta: { system: "AISIS", page: "Class Schedule" },
	},
];
