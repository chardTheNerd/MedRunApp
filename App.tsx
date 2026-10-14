import { AppProviders } from './src/app/AppProviders';
import { BootstrapScreen } from './src/presentation/screens/BootstrapScreen';

export default function App() {
  return (
    <AppProviders>
      <BootstrapScreen />
    </AppProviders>
  );
}
