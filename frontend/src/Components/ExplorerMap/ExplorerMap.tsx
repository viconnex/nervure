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
let progress = -1

const getPolylineFromNodeEdge = (node: NodeEdge, id: number): PolyLine => {
  const from = new LatLng(node.from.x, node.from.y)
  const to = new LatLng(node.to.x, node.to.y)
  return {
    id,
    edges: [from, to],
    weight: node.weight
  }
}

type IsochroneResponse = {
  polygons: {
    geometry: {
      coordinates: number[][][]
    }
  }[]
}



const ExplorerMap = (): ReactElement => {
  const [targetPoints, setTargetPoint] = useState<null | number[]>(null)
  const [isochronePolylines, setIsochronePolylines] = useState<PolyLine[]>([])
  const [polylines, setPolylines] = useState<PolyLine[]>([])
  const [tips, setTips] = useState<TipMarker[]>([])
  const [searchBuffer, setSearchBuffer] = useState<NodeEdge[]>([])
  const [searchBufferIndex, setSearchBufferIndex] = useState<null | number>(null)
  const [delay, setDelay] = useState<null | number>(100)

  const fetchSearchEdges = async () => {
    if (!targetPoints) {
      return;
    }
    const url = new URL('http://localhost:8989/node_weight');
    const params = {
      'point': `${targetPoints[0]},${targetPoints[1]}`,
      'time_limit': '600',
      'reverse_flow': 'true'
    }

    url.search = new URLSearchParams(params).toString();
    console.log(url.toJSON())
    const response = await fetch(await url.toJSON())

    const edges: NodeEdge[] = await response.json()
    // setSearchBuffer(edges)
    // setSearchBufferIndex(0)
    setPolylines(edges.map(getPolylineFromNodeEdge))
  }

  const fetchTips = async () => {
    const response = await fetch(
      'http://localhost:8989/tips?point=48.886038,2.358665&time_limit=300&reverse_flow=true',
    )
    const tipCoordinates: Coordinate[] = await response.json()
    // setSearchBuffer(edges)
    // setSearchBufferIndex(0)
    setTips(
      tipCoordinates.map((tipCoordinate, index) => ({
        position: new LatLng(tipCoordinate.x, tipCoordinate.y),
        id: index,
      })),
    )
  }

  const fetchIsochrone = async () => {
    const response = await fetch(
      'http://localhost:8989/isochrone?point=48.886038,2.358665&time_limit=300&buckets=1&reverse_flow=true',
    )
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

  const drawFromBuffer = () => {
    if (null === searchBufferIndex || searchBufferIndex >= searchBuffer.length) {
      return
    }

    const currentProgress = Math.floor((searchBufferIndex / searchBuffer.length) * 100)

    if (currentProgress > progress) {
      console.log(`Progression : ${currentProgress} %`)
      progress += 1
    }

    const newPolyline = getPolylineFromNodeEdge(searchBuffer[searchBufferIndex], searchBufferIndex)

    setSearchBufferIndex(searchBufferIndex + 1)
    setPolylines([...polylines, newPolyline])
  }

  useEffect(() => {
    fetchSearchEdges()
    // fetchIsochrone()
    // fetchTips()
  }, [targetPoints])

  const handleMapClick = (event: LeafletMouseEvent) => {
    setTargetPoint([event.latlng.lat, event.latlng.lng])
  }

  // useInterval(addRandomPoint, 100);
  useInterval(drawFromBuffer, delay)

  return (
    <div className="map">
      <div>
        <button onClick={() => setDelay(null)}>Pause</button>
        <button onClick={() => setDelay(100)}>Play</button>
      </div>
      <Map center={[48.886038, 2.358665]} zoom={14} onClick={handleMapClick}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {isochronePolylines.map(polyline => (
          <Polyline positions={polyline.edges} key={polyline.id} color="red" />
        ))}
        {polylines.map(polyline => (
          <Polyline positions={polyline.edges} key={polyline.id} weight={polyline.weight ? Math.log(polyline.weight) : 1}/>
        ))}
        {tips.map(tip => (
          <Marker position={tip.position} key={tip.id} />
        ))}
      </Map>
    </div>
  )
}

export default ExplorerMap
