export type Language = 'es' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  es: {
    // General
    app_name: 'RecordFlow',
    app_tagline: 'Grabador local e ilimitado de pantalla y cámara',
    unlimited_badge: '100% Local • Ilimitado',
    loom_alt: 'Alternativa Libre a Loom',
    
    // Status
    status_ready: 'Listo',
    status_recording: 'Grabando',
    
    // Navigation & Tabs
    tab_record: 'Grabador',
    tab_recent: 'Grabaciones Recientes',
    
    // Recording Modes
    mode_screen_camera: 'Pantalla + Cámara',
    mode_screen_only: 'Solo Pantalla',
    mode_camera_only: 'Solo Cámara',
    mode_screen_camera_desc: 'Graba la pantalla con tu cámara en burbuja circular flotante',
    mode_screen_only_desc: 'Graba toda la pantalla, ventana o pestaña seleccionada',
    mode_camera_only_desc: 'Graba exclusivamente tu cámara web',
    
    // Audio Options
    audio_mic_label: 'Micrófono',
    audio_mic_active: 'Activo',
    audio_mic_muted: 'Silenciado',
    audio_mic_desc: 'Incluir voz desde el micrófono en la grabación',
    
    // Buttons & Actions
    btn_start_recording: 'Iniciar Grabación',
    btn_stop_recording: 'Detener Grabación',
    btn_finish_recording: 'Finalizar',
    btn_cancel: 'Cancelar',
    btn_download_video: 'Descargar Video (.webm)',
    btn_download_mp4: 'Descargar Video (.mp4)',
    btn_download_webm: 'Descargar Video (.webm)',
    btn_copy_link: 'Copiar Enlace Local',
    btn_link_copied: '¡Enlace copiado!',
    btn_record_new: 'Grabar Nuevo Video',
    btn_delete: 'Eliminar',
    btn_rename: 'Renombrar',
    btn_save: 'Guardar',
    
    // Floating Control Bar
    floating_recording: 'REC',
    floating_paused: 'PAUSA',
    floating_finish: 'Finalizar',
    floating_pause: 'Pausar',
    floating_resume: 'Reanudar',
    floating_mute: 'Silenciar mic',
    floating_unmute: 'Activar mic',
    floating_cam_hide: 'Ocultar cámara',
    floating_cam_show: 'Mostrar cámara',
    floating_size: 'Tamaño',
    floating_discard: 'Descartar',
    confirm_discard: '¿Descartar esta grabación sin guardar?',

    // Live Camera & Audio Preview
    camera_preview_title: 'Vista previa de cámara',
    camera_preview_hint: 'Comprueba tu iluminación y encuadre',
    camera_preview_error: 'No se pudo acceder a la cámara para la vista previa',
    vu_meter_label: 'Nivel de entrada',
    playback_speed: 'Velocidad',
    
    // Recent Recordings
    no_recordings_title: 'No hay grabaciones guardadas',
    no_recordings_desc: 'Tus videos se guardan 100% en tu navegador, sin límites ni nubes de terceros.',
    meta_duration: 'Duración',
    meta_size: 'Tamaño',
    meta_date: 'Fecha',
    meta_mode: 'Modo',
    confirm_delete: '¿Estás seguro de que deseas eliminar esta grabación? Esta acción no se puede deshacer.',
    
    // Preview Page
    preview_header_title: 'RecordFlow Studio',
    preview_subtitle: 'Grabación completada con éxito • Almacenamiento local',
    preview_player_title: 'Reproductor de Video',
    preview_file_details: 'Detalles del Archivo',
    preview_all_recordings: 'Tus Grabaciones Guardadas',
    preview_format: 'Formato WebM de alta fidelidad',
    
    // Errors & Notices
    err_restricted_page: 'Por favor abre una página web regular (HTTP/HTTPS) para grabar.',
    err_permission_denied: 'Permiso de pantalla o cámara denegado.',
    err_recording_failed: 'Ocurrió un error al iniciar la grabación.',
    notice_recording_active: 'Grabación en curso en la pestaña activa...',
    
    // Universal Studio Recorder
    universal_studio_title: 'RecordFlow Studio — Grabador Universal',
    universal_studio_subtitle: 'Graba cualquier pantalla, ventana o aplicación del equipo',
    universal_status_recording: 'Grabando pantalla...',
    universal_instructions: 'Puedes minimizar esta pestaña y trabajar en cualquier aplicación de tu equipo (VS Code, terminal, juegos, etc.). Cuando termines, haz clic en Detener o usa el botón \'Dejar de compartir\' de Chrome.',
    universal_btn_stop_save: 'Detener y Guardar Grabación',
    universal_prompt_title: 'Estudio de Grabación Universal',
    universal_prompt_desc: 'Graba cualquier aplicación, ventana o tu pantalla completa sin restricciones.',
    universal_btn_start_share: 'Seleccionar Pantalla y Comenzar',
    universal_cancelled_title: 'Selección Cancelada',
    universal_cancelled_desc: 'No se seleccionó ninguna pantalla o se canceló el permiso. Puedes reintentar cuando desees.',
    universal_btn_retry: 'Reintentar Selección',
    open_universal_studio: 'O abrir Estudio Universal para grabar cualquier app',
    launch_floating_studio: 'Abrir Estudio Flotante en la página',
    floating_hub_title: 'Estudio Flotante',
    floating_launcher_tooltip: 'Grabar pantalla con RecordFlow',
    floating_launcher_hide: 'Ocultar botón flotante',
    
    // Footer Branding
    developed_by: 'Desarrollado por',
  },
  en: {
    // General
    app_name: 'RecordFlow',
    app_tagline: 'Local-first & unlimited screen and camera recorder',
    unlimited_badge: '100% Local • Unlimited',
    loom_alt: 'Free Loom Alternative',
    
    // Status
    status_ready: 'Ready',
    status_recording: 'Recording',
    
    // Navigation & Tabs
    tab_record: 'Recorder',
    tab_recent: 'Recent Recordings',
    
    // Recording Modes
    mode_screen_camera: 'Screen + Camera',
    mode_screen_only: 'Screen Only',
    mode_camera_only: 'Camera Only',
    mode_screen_camera_desc: 'Record screen with circular floating webcam bubble',
    mode_screen_only_desc: 'Record full screen, window, or selected tab',
    mode_camera_only_desc: 'Record webcam video exclusively',
    
    // Audio Options
    audio_mic_label: 'Microphone',
    audio_mic_active: 'Active',
    audio_mic_muted: 'Muted',
    audio_mic_desc: 'Include voice from microphone in recording',
    
    // Buttons & Actions
    btn_start_recording: 'Start Recording',
    btn_stop_recording: 'Stop Recording',
    btn_finish_recording: 'Finish',
    btn_cancel: 'Cancel',
    btn_download_video: 'Download Video (.webm)',
    btn_download_mp4: 'Download Video (.mp4)',
    btn_download_webm: 'Download Video (.webm)',
    btn_copy_link: 'Copy Local Link',
    btn_link_copied: 'Link copied!',
    btn_record_new: 'Record New Video',
    btn_delete: 'Delete',
    btn_rename: 'Rename',
    btn_save: 'Save',
    
    // Floating Control Bar
    floating_recording: 'REC',
    floating_paused: 'PAUSED',
    floating_finish: 'Finish',
    floating_pause: 'Pause',
    floating_resume: 'Resume',
    floating_mute: 'Mute mic',
    floating_unmute: 'Unmute mic',
    floating_cam_hide: 'Hide camera',
    floating_cam_show: 'Show camera',
    floating_size: 'Size',
    floating_discard: 'Discard',
    confirm_discard: 'Discard this recording without saving?',

    // Live Camera & Audio Preview
    camera_preview_title: 'Live Camera Preview',
    camera_preview_hint: 'Check your framing and lighting',
    camera_preview_error: 'Unable to access camera for preview',
    vu_meter_label: 'Input level',
    playback_speed: 'Speed',
    
    // Recent Recordings
    no_recordings_title: 'No saved recordings yet',
    no_recordings_desc: 'Your videos are saved 100% locally in your browser with zero caps.',
    meta_duration: 'Duration',
    meta_size: 'Size',
    meta_date: 'Date',
    meta_mode: 'Mode',
    confirm_delete: 'Are you sure you want to delete this recording? This action cannot be undone.',
    
    // Preview Page
    preview_header_title: 'RecordFlow Studio',
    preview_subtitle: 'Recording finished successfully • Local storage',
    preview_player_title: 'Video Player',
    preview_file_details: 'File Details',
    preview_all_recordings: 'Your Saved Recordings',
    preview_format: 'High-fidelity WebM container',
    
    // Errors & Notices
    err_restricted_page: 'Please navigate to a regular web page (HTTP/HTTPS) to record.',
    err_permission_denied: 'Screen or camera permission was denied.',
    err_recording_failed: 'An error occurred while starting the recording.',
    notice_recording_active: 'Recording in progress on active tab...',
    
    // Universal Studio Recorder
    universal_studio_title: 'RecordFlow Studio — Universal Recorder',
    universal_studio_subtitle: 'Record any screen, window, or desktop application',
    universal_status_recording: 'Recording screen...',
    universal_instructions: 'You can minimize this tab and work in any application on your computer (VS Code, terminal, games, etc.). When you\'re done, click Stop or use Chrome\'s \'Stop sharing\' button.',
    universal_btn_stop_save: 'Stop and Save Recording',
    universal_prompt_title: 'Universal Studio Recorder',
    universal_prompt_desc: 'Record any application, window, or your entire screen without page restrictions.',
    universal_btn_start_share: 'Select Screen & Start',
    universal_cancelled_title: 'Selection Cancelled',
    universal_cancelled_desc: 'No screen was selected or permission was cancelled. You can retry whenever you are ready.',
    universal_btn_retry: 'Retry Selection',
    open_universal_studio: 'Or open Universal Studio to record any app',
    launch_floating_studio: 'Open Floating Studio on page',
    floating_hub_title: 'Floating Studio',
    floating_launcher_tooltip: 'Record screen with RecordFlow',
    floating_launcher_hide: 'Hide floating button',
    
    // Footer Branding
    developed_by: 'Developed by',
  },
};

const LANG_STORAGE_KEY = 'recordflow_lang';

export async function getCurrentLang(): Promise<Language> {
  try {
    const data = await chrome.storage.local.get(LANG_STORAGE_KEY);
    if (data[LANG_STORAGE_KEY] === 'es' || data[LANG_STORAGE_KEY] === 'en') {
      return data[LANG_STORAGE_KEY];
    }
  } catch {
    // Fallback if storage not ready
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export async function setLang(lang: Language): Promise<void> {
  await chrome.storage.local.set({ [LANG_STORAGE_KEY]: lang });
}

export function t(key: string, lang: Language = 'es'): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: number, lang: Language = 'es'): string {
  const date = new Date(timestamp);
  return date.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
