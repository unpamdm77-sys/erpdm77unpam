/**
 * Google Chat Integration Service
 * Supports both Google Chat Webhook and Google Chat REST API v1
 */

export interface GoogleChatMessagePayload {
  text?: string;
  cardsV2?: any[];
}

/**
 * Send a notification message to Google Chat via incoming webhook URL
 */
export async function sendToGoogleChatWebhook(
  webhookUrl: string,
  message: GoogleChatMessagePayload
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://chat.googleapis.com/')) {
    return {
      success: false,
      message: 'URL Google Chat Webhook tidak valid. Pastikan diawali https://chat.googleapis.com/'
    };
  }

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(message)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Google Chat API Error (${res.status}): ${errText}` };
    }

    return { success: true, message: 'Notifikasi berhasil terkirim ke Google Chat Space!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim pesan ke Google Chat.' };
  }
}

/**
 * List Spaces user has access to using Google Chat REST API v1
 */
export async function listGoogleChatSpaces(
  accessToken: string
): Promise<{ success: boolean; spaces?: { name: string; displayName?: string; type?: string }[]; error?: string }> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Google Chat API (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, spaces: data.spaces || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengambil daftar space Google Chat.' };
  }
}

/**
 * Send a message to a specific Google Chat space using Google Chat REST API v1
 */
export async function sendGoogleChatMessageToSpace(
  spaceName: string,
  text: string,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanSpaceName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
    const res = await fetch(`https://chat.googleapis.com/v1/${cleanSpaceName}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Google Chat API (${res.status}): ${errText}` };
    }

    return { success: true, message: 'Pesan berhasil diposting ke Google Chat Space!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim pesan ke Google Chat.' };
  }
}

/**
 * Helper to build an RSI notification card/message
 */
export function formatRsiChatNotification(
  action: 'REQUEST_CREATED' | 'REQUEST_COMMITTED',
  rsi: {
    requestNo: string;
    materialName: string;
    qty: number;
    unit: string;
    purposeCategory: string;
    requestedBy: string;
    notes?: string;
    committedBy?: string;
  }
): GoogleChatMessagePayload {
  if (action === 'REQUEST_CREATED') {
    return {
      text: `📢 *[RSI BARU - PENDING APPROVAL]*\n*Nomor RSI:* ${rsi.requestNo}\n*Bahan:* ${rsi.materialName}\n*Jumlah:* ${rsi.qty} ${rsi.unit}\n*Tujuan:* ${rsi.purposeCategory}\n*Pemohon:* ${rsi.requestedBy}\n*Catatan:* ${rsi.notes || '-'}\n\n👉 _Mohon Supervisor / Manager / Owner untuk meninjau di Sistem ERP POS Dimsum Mentai 77._`
    };
  } else {
    return {
      text: `✅ *[RSI TELAH DI-COMMIT & STOK BERKURANG]*\n*Nomor RSI:* ${rsi.requestNo}\n*Bahan:* ${rsi.materialName} (${rsi.qty} ${rsi.unit})\n*Tujuan:* ${rsi.purposeCategory}\n*Disetujui & Dikeluarkan oleh:* ${rsi.committedBy || 'Manager'}\n*Pemohon:* ${rsi.requestedBy}\n*Waktu:* ${new Date().toLocaleString('id-ID')}`
    };
  }
}
