export interface QrValidationResult {
  valid?: boolean;
  message?: string;
  ticket_id?: string;
  category?: string;
  seat_code?: string | null;
}

export interface TicketScanResult {
  message?: string;
  status?: string;
  ticket_id?: string;
  seat_code?: string | null;
  access_log_id?: string;
  code?: string;
}

export interface AccessStats {
  totalAccesses?: number;
  total?: number;
}

export interface AccessLogEntry {
  log_id?: string;
  ticket_id?: string;
  event_id?: string;
  access_time?: string;
  status?: string;
  gate_id?: string;
}
