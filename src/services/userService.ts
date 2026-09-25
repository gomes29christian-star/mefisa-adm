import { Usuario } from '../types/clinic';
import { MOCK_USUARIOS } from '../data/mockClinicData';

const STORAGE_KEY_USUARIOS = 'clinica_mefisa_usuarios_custom_v1';
const STORAGE_KEY_ACTIVE_USER_ID = 'clinica_mefisa_active_usuario_id_v1';

export const gerarSenhaExtremamenteLonga = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~';
  let result = 'mefisa_sys_secure_key_';
  const array = new Uint8Array(128);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
};

export const carregarUsuariosIniciais = (): Usuario[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USUARIOS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every user has a systemPassword
        let modified = false;
        const normalized = parsed.map((u: Usuario) => {
          if (!u.systemPassword) {
            modified = true;
            return {
              ...u,
              systemPassword: gerarSenhaExtremamenteLonga(),
              personalPasscode: u.personalPasscode || '1234',
            };
          }
          return u;
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar usuários:', e);
  }

  // Fallback to MOCK_USUARIOS with generated system passwords
  const initialWithPasswords: Usuario[] = MOCK_USUARIOS.map((u) => ({
    ...u,
    systemPassword: gerarSenhaExtremamenteLonga(),
    personalPasscode: '1234',
  }));

  try {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(initialWithPasswords));
  } catch (e) {}

  return initialWithPasswords;
};

export const salvarUsuariosStorage = (usuarios: Usuario[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  } catch (e) {
    console.error('Erro ao salvar usuários:', e);
  }
};

export const carregarAtivoIdStorage = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_USER_ID);
  } catch (e) {
    return null;
  }
};

export const salvarAtivoIdStorage = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER_ID, id);
  } catch (e) {}
};
