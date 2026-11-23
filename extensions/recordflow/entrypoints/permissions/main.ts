let activeStream: MediaStream | null = null;

const previewVideo = document.getElementById('preview-video') as HTMLVideoElement;
const previewPlaceholder = document.getElementById('preview-placeholder') as HTMLElement;
const statusPill = document.getElementById('status-pill') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
const micSelect = document.getElementById('mic-select') as HTMLSelectElement;
const btnRequest = document.getElementById('btn-request') as HTMLButtonElement;

async function loadDeviceList() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const audioDevices = devices.filter((d) => d.kind === 'audioinput');

    // Cargar cámaras
    const savedCam = (await chrome.storage.local.get('recordflow_camera_id'))
      ?.recordflow_camera_id;
    cameraSelect.innerHTML = '';
    videoDevices.forEach((device, index) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || `Cámara ${index + 1}`;
      if (savedCam && savedCam === device.deviceId) {
        opt.selected = true;
      }
      cameraSelect.appendChild(opt);
    });

    // Cargar micrófonos
    const savedMic = (await chrome.storage.local.get('recordflow_mic_id'))
      ?.recordflow_mic_id;
    micSelect.innerHTML = '';
    audioDevices.forEach((device, index) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || `Micrófono ${index + 1}`;
      if (savedMic && savedMic === device.deviceId) {
        opt.selected = true;
      }
      micSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error enumerando dispositivos:', err);
  }
}

async function startHardware(camId?: string, micId?: string) {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }

  const videoConstraints: MediaTrackConstraints = camId
    ? { deviceId: { exact: camId } }
    : { width: { ideal: 1280 }, height: { ideal: 720 } };

  const audioConstraints: MediaTrackConstraints | boolean = micId
    ? { deviceId: { exact: micId } }
    : true;

  try {
    activeStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: audioConstraints,
    });

    previewPlaceholder.style.display = 'none';
    previewVideo.style.display = 'block';
    previewVideo.srcObject = activeStream;
    await previewVideo.play().catch(() => {});

    statusPill.className = 'status-pill';
    statusText.textContent = 'Permisos Concedidos y Activos';
    btnRequest.textContent = 'Guardar y Cerrar';

    await chrome.storage.local.set({
      recordflow_permissions_granted: true,
      recordflow_camera_id: cameraSelect.value,
      recordflow_mic_id: micSelect.value,
    });

    await loadDeviceList();
  } catch (err: any) {
    statusPill.className = 'status-pill error';
    statusText.textContent = `Error: ${err?.message || 'No se pudo acceder'}`;
  }
}

btnRequest.addEventListener('click', async () => {
  if (statusText.textContent === 'Permisos Concedidos y Activos') {
    await chrome.storage.local.set({
      recordflow_camera_id: cameraSelect.value,
      recordflow_mic_id: micSelect.value,
    });
    window.close();
    return;
  }
  await startHardware(cameraSelect.value, micSelect.value);
});

cameraSelect.addEventListener('change', () => {
  startHardware(cameraSelect.value, micSelect.value);
});

micSelect.addEventListener('change', () => {
  startHardware(cameraSelect.value, micSelect.value);
});

// Al cargar, verificar si ya hay permisos
navigator.mediaDevices.enumerateDevices().then((devices) => {
  const hasLabels = devices.some((d) => d.label.length > 0);
  if (hasLabels) {
    loadDeviceList();
    startHardware();
  }
});
