import { Stack } from "expo-router"
import PlanetHeader from "../components/PlanetHeader"
export default function Layout() {
    return (
        <Stack>
            <Stack.Screen
                name='index'
                options={{
                    title: 'Planets',
                }}
            />
            <Stack.Screen
                name='detail'
                options={{
                    headerTitle: () => <PlanetHeader />
                }}
            />
        </Stack>
    )
}