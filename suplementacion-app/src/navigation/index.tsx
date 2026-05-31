import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddSuplementoScreen from '../screens/AddSuplementoScreen';
import SuplementoDetalleScreen from '../screens/SuplementoDetalleScreen';
import EditSuplementoScreen from '../screens/EditSuplementoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111111',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Registrarse' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Mis Suplementos', headerShown: false }}
        />
        <Stack.Screen
          name="AddSuplemento"
          component={AddSuplementoScreen}
          options={{ title: 'Añadir Suplemento' }}
        />
        <Stack.Screen
          name="SuplementoDetalle"
          component={SuplementoDetalleScreen}
          options={{ title: 'Detalle' }}
        />
        <Stack.Screen
          name="EditSuplemento"
          component={EditSuplementoScreen}
          options={{ title: 'Editar Suplemento' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
