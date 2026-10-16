import { Redirect } from 'expo-router';

/** Root path: the splash decides where to go. */
export default function Index() {
  return <Redirect href="/splash" />;
}
