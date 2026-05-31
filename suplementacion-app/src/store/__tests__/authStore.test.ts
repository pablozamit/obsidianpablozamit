import { useAuthStore } from '../index';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().setUsuario(null);
    useAuthStore.getState().logout();
  });

  it('should initialize with null usuario and loading true', () => {
    const { usuario, loading } = useAuthStore.getState();
    expect(usuario).toBeNull();
    expect(loading).toBe(true);
  });

  it('should set usuario correctly', () => {
    const mockUsuario = {
      uid: 'test-uid',
      email: 'test@example.com',
      nombre: 'Test User',
      creadoEn: new Date(),
    };

    useAuthStore.getState().setUsuario(mockUsuario);
    const { usuario } = useAuthStore.getState();

    expect(usuario).toEqual(mockUsuario);
  });

  it('should set loading state correctly', () => {
    useAuthStore.getState().setLoading(false);
    const { loading } = useAuthStore.getState();

    expect(loading).toBe(false);
  });

  it('should logout correctly', () => {
    const mockUsuario = {
      uid: 'test-uid',
      email: 'test@example.com',
      nombre: 'Test User',
      creadoEn: new Date(),
    };

    useAuthStore.getState().setUsuario(mockUsuario);
    useAuthStore.getState().logout();

    const { usuario, loading } = useAuthStore.getState();

    expect(usuario).toBeNull();
    expect(loading).toBe(false);
  });

  it('should update usuario and set loading to false when setUsuario is called', () => {
    const mockUsuario = {
      uid: 'test-uid',
      email: 'test@example.com',
      nombre: 'Test User',
      creadoEn: new Date(),
    };

    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setUsuario(mockUsuario);

    const { usuario, loading } = useAuthStore.getState();

    expect(usuario).toEqual(mockUsuario);
    expect(loading).toBe(false);
  });
});
