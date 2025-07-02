import { useState, useEffect } from "react"
import { FlatList, Alert } from "react-native"
import ItemSeparator from "../components/ItemSeperator"
import PlantetListItem from "../components/PlanetListItem"
import Spinner from "../components/Spinner"




export default function Home() {
    const [planets, setPlanets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPlanets = async () => {
            try {

                const response = await fetch("https://swapi.tech/api/planets", {
                    method: 'GET',
                    headers: {
                        contentType: 'application/json',
                    }
                })
                if (!response.ok) {
                    Alert.alert("Error", `The Server responded with
${response.status} ${response.statusText}`)
                }
                const planetData = await response.json()
                setPlanets(planetData.results)
            } catch (error) {
                console.log(error)
                Alert.alert("An Error occurred", error.message)
            }
        }
        loadPlanets()
        setIsLoading(false)
    }, [])
    return (
        isLoading ? <Spinner /> :

            <>
        
                <FlatList
                    data={planets}
                    renderItem={PlantetListItem}
                    ItemSeparatorComponent={ItemSeparator}
                />
            </>
    )
}