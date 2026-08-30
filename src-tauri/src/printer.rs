use serialport::SerialPort;
use std::time::Duration;

// Tabela de Comandos Físicos ESC/POS (Hexadecimal)
pub const ESC_INIT: &[u8] = &[0x1B, 0x40];                            // ESC @ (Inicializar impressora)
pub const ESC_DRAWER_PULSE: &[u8] = &[0x1B, 0x70, 0x00, 0x19, 0xFA]; // ESC p 0 25 250 (Abrir gaveta Pino 2)
pub const GS_CUT_PAPER: &[u8] = &[0x1D, 0x56, 0x00];                  // GS V 0 (Corte total do papel)

#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.into_iter().map(|p| p.port_name).collect()),
        Err(e) => Err(format!("Erro ao listar portas: {}", e)),
    }
}

#[tauri::command]
pub fn open_cash_drawer(port_name: String, baud_rate: u32) -> Result<(), String> {
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(500))
        .open()
        .map_err(|e| format!("Falha ao abrir porta {}: {}", port_name, e))?;

    port.write_all(ESC_DRAWER_PULSE)
        .map_err(|e| format!("Erro ao enviar pulso para a gaveta: {}", e))?;
    
    port.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn print_escpos_raw(
    port_name: String,
    baud_rate: u32,
    payload: Vec<u8>,
    open_drawer: bool,
    cut: bool,
) -> Result<(), String> {
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(1500))
        .open()
        .map_err(|e| format!("Impressora inacessível em {}: {}", port_name, e))?;

    let mut buffer: Vec<u8> = Vec::new();
    
    // 1. Reset da impressora
    buffer.extend_from_slice(ESC_INIT);

    // 2. Pulso de abertura da gaveta (se solicitado na venda)
    if open_drawer {
        buffer.extend_from_slice(ESC_DRAWER_PULSE);
    }

    // 3. Conteúdo binário do recibo
    buffer.extend_from_slice(&payload);

    // 4. Corte de papel
    if cut {
        buffer.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // Avanço de 3 linhas
        buffer.extend_from_slice(GS_CUT_PAPER);
    }

    port.write_all(&buffer)
        .map_err(|e| format!("Erro na transmissão de dados: {}", e))?;

    port.flush().map_err(|e| e.to_string())?;
    Ok(())
}
