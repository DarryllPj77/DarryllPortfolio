import type { CaseStudyChapter, ProjectScreenshot } from './types';

/*
 * Academic Sentinel screenshots, grouped into the case-study story.
 * Files live in /public/image/projects/academic-sentinel/ and are used as-is.
 * Captions and alt text describe only what each screenshot shows.
 *
 * Left out on purpose: teacher-violation-report-export.jpg (shows a third
 * party's email and browsing history; add it back once those are blurred).
 */

const DIR = '/image/projects/academic-sentinel';

function shot(
  file: string,
  width: number,
  height: number,
  caption: string,
  alt: string,
): ProjectScreenshot {
  return { src: `${DIR}/${file}`, width, height, caption, alt };
}

export const academicSentinelHero = shot(
  'teacher-live-monitoring.jpg',
  1125,
  653,
  'Instructor Monitoring Console during an active session',
  'Academic Sentinel Instructor Monitoring Console with monitoring active. The participant list shows one student flagged for a window switch, and the Global Log Feed lists live violations such as window switches, clipboard copy and paste, and a screenshot capture, alongside entries where the student returned to the exam.',
);

export const academicSentinelChapters: CaseStudyChapter[] = [
  {
    id: 'accounts',
    title: 'Accounts',
    intro:
      'Students and teachers sign in to separate roles. New users register as a teacher or a student, and each role has a profile page with a password change form.',
    blocks: [
      {
        layout: 'pair',
        shots: [
          shot(
            'student-login.jpg',
            957,
            628,
            'Student login',
            'Academic Sentinel login screen with the Student role selected, email and password fields, and a link to create an account.',
          ),
          shot(
            'teacher-login.jpg',
            952,
            618,
            'Teacher login',
            'Academic Sentinel login screen with the Teacher role selected, email and password fields, and a link to create an account.',
          ),
        ],
      },
      {
        layout: 'grid',
        shots: [
          shot(
            'student-registration.jpg',
            464,
            337,
            'Student registration and confirmation',
            'Registration form with the Student role selected and an "Account created. You can sign in now." confirmation dialog.',
          ),
          shot(
            'teacher-registration.jpg',
            455,
            329,
            'Teacher registration and confirmation',
            'Registration form with the Teacher role selected and an "Account created. You can sign in now." confirmation dialog.',
          ),
          shot(
            'student-registration-success.jpg',
            576,
            320,
            'Student profile and security',
            'Student Dashboard profile page with profile picture, name and email fields, and a Security panel for changing the password.',
          ),
          shot(
            'teacher-registration-success.jpg',
            576,
            323,
            'Teacher profile and security',
            'Teacher Dashboard profile page with profile picture, name and email fields, and a Security panel for changing the password.',
          ),
        ],
      },
    ],
  },
  {
    id: 'teacher-workflow',
    title: 'Teacher workflow',
    intro:
      'A teacher creates a course room with a generated room code, then sets up each exam session: the exam type, the LMS exam URL students must stay on, and which behaviours to detect.',
    blocks: [
      {
        layout: 'grid',
        shots: [
          shot(
            'teacher-course-creation.jpg',
            378,
            403,
            'Creating a course room with a generated code',
            'Create New Room form with subject, section, a generated room code and an optional description.',
          ),
          shot(
            'teacher-course-dashboard.jpg',
            576,
            321,
            'Course dashboard',
            'Teacher Dashboard listing the teacher’s courses, with Create, Edit and Delete buttons.',
          ),
        ],
      },
      {
        layout: 'feature',
        shots: [
          shot(
            'teacher-session-setup.jpg',
            923,
            571,
            'Session setup: exam type, LMS exam URL and detection rules',
            'Session setup screen. The teacher picks the exam type (Summative, Midterm or Final), enters the required LMS exam URL that students are anchored to, and enables detection of virtual machines, clipboard actions and unauthorized apps.',
          ),
        ],
      },
      {
        layout: 'pair',
        shots: [
          shot(
            'teacher-detection-settings.jpg',
            361,
            279,
            'Detection rules and allowed apps',
            'Detection rules with checkboxes for virtual machine environments, clipboard actions, unauthorized apps and student inactivity, plus an Allowed Apps During Exam list with presets such as Microsoft Teams, Zoom, Calculator and Notepad.',
          ),
          shot(
            'teacher-monitoring-settings.jpg',
            370,
            279,
            'Strict mode, auto-stop timer and countdown',
            'Monitoring settings with a Strict Mode option, a timer that stops monitoring after a set duration, and a countdown before monitoring starts.',
          ),
        ],
      },
      {
        layout: 'feature',
        shots: [
          shot(
            'teacher-session-history.jpg',
            1063,
            635,
            'Course page: start a session and review past sessions',
            'Course page with a Create Session button and a Past Session table listing session date, duration, attendees and status, each with a View Archive button.',
          ),
        ],
      },
    ],
  },
  {
    id: 'student-workflow',
    title: 'Student workflow',
    intro:
      'Students join a course with the teacher’s code. During an exam they can raise a hand or ask to finish, and they cannot leave until the teacher approves.',
    blocks: [
      {
        layout: 'pair',
        shots: [
          shot(
            'student-course-enrollment.jpg',
            576,
            324,
            'Joining a course by code',
            'Student Dashboard with an Add Course by Code dialog containing a course code.',
          ),
          shot(
            'student-enrolled-courses.jpg',
            575,
            323,
            'Enrolled courses',
            'Student Dashboard listing an enrolled course marked "Not Joinable Yet".',
          ),
        ],
      },
      {
        layout: 'pair',
        shots: [
          shot(
            'student-leave-permission-blocked.jpg',
            508,
            193,
            'Student side: monitoring active, leaving blocked',
            'Student exam toolbar with Raise Hand and Done buttons, showing "Monitoring: ACTIVE" and "Leave Permission: Blocked".',
          ),
          shot(
            'teacher-exit-approval.jpg',
            373,
            424,
            'Teacher side: approving a request to finish',
            'Teacher participant list showing a student who wants to finish and leave, with Approve and Deny buttons.',
          ),
        ],
      },
    ],
  },
  {
    id: 'live-monitoring',
    title: 'Live monitoring',
    intro:
      'The instructor console shows each participant’s connection and status. Monitoring starts when the teacher chooses, and the participant list can be filtered by status.',
    blocks: [
      {
        layout: 'feature',
        shots: [
          shot(
            'teacher-global-log-feed.jpg',
            1173,
            685,
            'Console ready: student connected, monitoring not started yet',
            'Instructor Monitoring Console before monitoring starts. A Start Session Monitoring button is shown, one student is connected, and the Global Log Feed has a single "session joined" entry.',
          ),
        ],
      },
      {
        layout: 'grid',
        shots: [
          shot(
            'teacher-student-status.jpg',
            370,
            440,
            'Participant status filtered to Finished',
            'Participant list filtered to Finished, showing one student marked Done.',
          ),
        ],
      },
    ],
  },
  {
    id: 'violation-detection',
    title: 'Violation detection',
    intro:
      'While monitoring is active, the desktop client reports suspicious activity to the teacher’s log feed as it happens.',
    blocks: [
      {
        layout: 'pair',
        shots: [
          shot(
            'scenario-violation-clipboard-activity.jpg',
            416,
            210,
            'Student copies text from the exam',
            'A student’s screen with exam questions on the left and a text editor menu with the Copy option on the right.',
          ),
          shot(
            'violation-clipboard-activity.jpg',
            449,
            253,
            'The teacher’s feed logs the copy, the paste and the window switch',
            'Global Log Feed showing monitoring starting after a countdown, then clipboard copy, clipboard paste and window switch violations.',
          ),
        ],
      },
      {
        layout: 'log',
        shots: [
          shot(
            'violation-window-switch.jpg',
            521,
            191,
            'Window switching, and returning to the exam',
            'Log entries showing window switch violations away from the exam page, each followed by an entry for returning to the exam.',
          ),
          shot(
            'violation-idle-detection.jpg',
            483,
            57,
            'Idle detection',
            'Log entry: idle warning, no keyboard or mouse input for 30 seconds.',
          ),
          shot(
            'violation-unauthorized-process.jpg',
            524,
            57,
            'Unauthorized process detection',
            'Log entry: unauthorized process detected (claude, discord).',
          ),
          shot(
            'violation-multiple-monitor.jpg',
            440,
            279,
            'Multiple monitor detection',
            'One student’s log with multiple-monitor and unauthorized-process violations, beside a student details panel showing an alert count and the risk level "Possible Dishonesty".',
          ),
        ],
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports and session history',
    intro:
      'Violations add up to a penalty score and a risk level. Ended sessions are archived, with each student’s activity log available to review or export as a PDF.',
    blocks: [
      {
        layout: 'feature',
        shots: [
          shot(
            'teacher-violation-summary.jpg',
            1318,
            772,
            'Violation summary and risk status for one student',
            'Violation Summary for one student: total violations, a risk status of Possible Dishonesty with a penalty score, and a table of violation categories with occurrences and penalty points. A student details panel shows the environment profile and alert count.',
          ),
        ],
      },
      {
        layout: 'pair',
        shots: [
          shot(
            'teacher-student-activity-logs.jpg',
            486,
            332,
            'Student activity logs with event summary',
            'Activity Logs for one student: total events, total severity and risk level, a filterable table of timestamped events, an event-type summary and an Export PDF button.',
          ),
          shot(
            'teacher-session-archive.jpg',
            475,
            154,
            'Session archive',
            'Session Archive table listing a participant with violation count, risk level and connection status, with View Logs and Export PDF buttons.',
          ),
        ],
      },
    ],
  },
];
