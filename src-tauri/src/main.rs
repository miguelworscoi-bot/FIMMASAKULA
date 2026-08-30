// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod printer;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            printer::list_serial_ports,
            printer::open_cash_drawer,
            printer::print_escpos_raw
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao inicializar runtime do Worscoi Desktop");
}
