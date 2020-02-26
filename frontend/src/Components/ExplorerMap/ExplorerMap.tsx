import React, { useEffect, useState, ReactElement } from 'react'
import { Map, Marker, Popup, TileLayer, Polyline } from 'react-leaflet'
import { LatLng, LeafletMouseEvent } from 'leaflet'

import { useInterval } from 'utils/hooks'

import './style.css'

type NodeEdge = {
  from: Coordinate
  to: Coordinate
  weight?: number
}

type TipMarker = {
  id: number
  position: LatLng
}

type Coordinate = {
  x: number
  y: number
}

type PolyLine = {
  id: number
  edges: LatLng[]
  weight?: number
}
const progress = -1

let maxWeight = -1
let minWeight = -1

const pixelWeight = (weight: number): number => {
  return Math.round(Math.log(weight)) + 1
}

const setWeightRange = (nodes: NodeEdge[]) => {
  nodes.forEach(node => {
    if (node.weight && maxWeight === -1) {
      maxWeight = node.weight
      minWeight = node.weight
      return
    }
    if (node.weight && node.weight > maxWeight) {
      maxWeight = node.weight
    }
    if (node.weight && node.weight < minWeight) {
      minWeight = node.weight
    }
  })
  minWeight = pixelWeight(minWeight)
  maxWeight = pixelWeight(maxWeight)
}

const getPolylineFromNodeEdge = (node: NodeEdge, id: number): PolyLine => {
  const from = new LatLng(node.from.x, node.from.y)
  const to = new LatLng(node.to.x, node.to.y)
  return {
    id,
    edges: [from, to],
    weight: node.weight,
  }
}

type IsochroneResponse = {
  polygons: {
    geometry: {
      coordinates: number[][][]
    }
  }[]
}
function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}
const blues = ['#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704']

const getColorFromWeight = (weight: number) => {
  return blues[Math.floor(((weight - minWeight) / (maxWeight - minWeight)) * blues.length)]
}

const ExplorerMap = (): ReactElement => {
  const [targetPoints, setTargetPoint] = useState<null | number[]>(null)
  const [isochronePolylines, setIsochronePolylines] = useState<PolyLine[]>([])
  const [polylines, setPolylines] = useState<PolyLine[]>([])
  const [tips, setTips] = useState<TipMarker[]>([])
  const [searchBuffer, setSearchBuffer] = useState<NodeEdge[]>([])
  const [searchBufferIndex, setSearchBufferIndex] = useState<null | number>(null)
  const [delay, setDelay] = useState<null | number>(100)

  const fetchTips = async () => {
    const response = await fetch(
      'http://localhost:8989/tips?point=48.886038,2.358665&time_limit=300&reverse_flow=true',
    )
    const tipCoordinates: Coordinate[] = await response.json()
    setTips(
      tipCoordinates.map((tipCoordinate, index) => ({
        position: new LatLng(tipCoordinate.x, tipCoordinate.y),
        id: index,
      })),
    )
  }

  useEffect(() => {
    const fetchSearchEdges = async (): Promise<void> => {
      if (!targetPoints) {
        return
      }
      const url = new URL('http://localhost:8989/node_weight')
      const params = {
        point: `${targetPoints[0]},${targetPoints[1]}`,
        // eslint-disable-next-line
        time_limit: '600',
        // eslint-disable-next-line
        reverse_flow: 'true',
        vehicle: 'car',
      }
      url.search = new URLSearchParams(params).toString()

      const response = await fetch(await url.toJSON())
      try {
        const edges: NodeEdge[] = await response.json()
        setWeightRange(edges)
        console.log('max-min', maxWeight, minWeight)
        setPolylines(edges.map(getPolylineFromNodeEdge))
      } catch (error) {
        console.log(error)
      }
    }
    const fetchBassins = async () => {
      if (!targetPoints) {
        return
      }
      const url = new URL('http://localhost:8989/bassin-versant')
      const params = {
        point: `${targetPoints[0]},${targetPoints[1]}`,
        // eslint-disable-next-line
        time_limit: '1800',
        // eslint-disable-next-line
        reverse_flow: 'true',
        vehicle: 'bike',
      }
      url.search = new URLSearchParams(params).toString()

      const response = await fetch(await url.toJSON())
      const isochrone: IsochroneResponse = await response.json()
      setIsochronePolylines(
        isochrone.polygons.map((polygone, index) => {
          return {
            id: index,
            edges: polygone.geometry.coordinates[0].map(coordinate => {
              return new LatLng(
                Math.round(coordinate[1] * 1000000) / 1000000,
                Math.round(coordinate[0] * 1000000) / 1000000,
              )
            }),
          }
        }),
      )
    }

    fetchSearchEdges()
    // fetchBassins()
  }, [targetPoints])

  const handleMapClick = (event: LeafletMouseEvent): void => {
    setTargetPoint([event.latlng.lat, event.latlng.lng])
  }
  const myFilter = [
    'blur:0px',
    'brightness:95%',
    'contrast:130%',
    'grayscale:20%',
    'hue:290deg',
    'opacity:100%',
    'invert:100%',
    'saturate:300%',
    'sepia:10%',
  ]

  return (
    <div className="map">
      <div>
        <button onClick={() => setDelay(null)}>Pause</button>
        <button onClick={() => setDelay(100)}>Play</button>
      </div>
      <Map center={[48.886038, 2.358665]} zoom={12} onClick={handleMapClick}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          filter={myFilter}
        />
        {isochronePolylines.map(polyline => (
          <Polyline positions={polyline.edges} key={polyline.id} color="red" />
        ))}
        {polylines.map(polyline => {
          const weight = polyline.weight ? pixelWeight(polyline.weight) : null
          const color = weight ? getColorFromWeight(weight) : 'black'

          return (
            <Polyline
              positions={polyline.edges}
              key={polyline.id}
              color={color}
              weight={weight || 1}
            />
          )
        })}
        {tips.map(tip => (
          <Marker position={tip.position} key={tip.id} />
        ))}
      </Map>
    </div>
  )
}

export default ExplorerMap
