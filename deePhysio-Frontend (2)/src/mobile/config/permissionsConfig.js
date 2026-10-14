/**
 * Minimum Permission Declarations & Explanations
 * Defines rationale shown to users BEFORE triggering native permission prompts.
 */

export const PERMISSIONS_CONFIG = {
  camera: {
    title: 'Camera Access Needed',
    message: 'ClinicPilot requires camera access so you can take and upload patient posture photos, clinical body charts, and medical prescription documents.',
    icon: 'camera',
    required: false
  },
  photos: {
    title: 'Photo Library Access',
    message: 'ClinicPilot needs access to your photos so you can select and attach existing medical reports and X-ray images to patient records.',
    icon: 'photos',
    required: false
  },
  notifications: {
    title: 'Appointment & Alert Notifications',
    message: 'Enable notifications to receive timely alerts for upcoming patient appointments, emergency schedule changes, and clinic messages.',
    icon: 'bell',
    required: false
  },
  storage: {
    title: 'File Download Access',
    message: 'Permission is needed to save invoice PDFs, clinical discharge summaries, and patient intake forms to your device storage.',
    icon: 'file',
    required: false
  }
};

export default PERMISSIONS_CONFIG;
