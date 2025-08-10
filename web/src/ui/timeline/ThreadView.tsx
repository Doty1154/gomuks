// gomuks - A Matrix client written in Go.
// Copyright (C) 2025 Tulir Asokan
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
import React, { use, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ScaleLoader } from "react-spinners"
import { usePreference, useRoomEvent } from "@/api/statestore"
import { EventID, EventRowID, MemDBEvent } from "@/api/types"
import ClientContext from "../ClientContext.ts"
import { RoomContext, RoomContextData, useRoomContext } from "../roomview/roomcontext.ts"
import TimelineEvent from "./TimelineEvent.tsx"
import { renderTimelineList } from "./timelineutil.tsx"
import "./ThreadView.css"

export interface ThreadViewProps {
	threadRoot: EventID
}

const ThreadView = ({ threadRoot }: ThreadViewProps) => {
	const client = use(ClientContext)!
	const parentRoomCtx = useRoomContext()
	const room = parentRoomCtx.store
	const [threadRoomCtx] = useState(() => new RoomContextData(room))
	const [prevBatch, setPrevBatch] = useState("")
	const [loading, setLoading] = useState(false)
	const [timeline, setTimeline] = useState<MemDBEvent[]>([])
	const [focusedEventRowID, directSetFocusedEventRowID] = useState<EventRowID | null>(null)
	const scrollFixRef = useRef<number>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<HTMLDivElement>(null)
	const smallReplies = usePreference(client.store, room, "small_replies")
	const rootEvent = useRoomEvent(room, threadRoot)
	client.requestEvent(room, threadRoot)

	useEffect(() => {
		threadRoomCtx.directSetFocusedEventRowID = directSetFocusedEventRowID
		window.addEventListener("resize", threadRoomCtx.scrollToBottom)
		return () => {
			window.removeEventListener("resize", threadRoomCtx.scrollToBottom)
		}
	}, [threadRoomCtx])
	useEffect(() => {
		setLoading(true)
		setTimeline([])
		client.rpc.paginateManual(room.roomID, "", "b", { threadRoot })
			.then(res => {
				setPrevBatch(res.next_batch)
				setTimeline(res.events.reverse().map(evt => room.applyEvent(evt)))
			}, err => {
				console.error("Failed to load thread history", err)
			})
			.finally(() => setLoading(false))
		return room.subscribeThread(threadRoot, evts => {
			setTimeline(currentTimeline => [...currentTimeline, ...evts])
		})
	}, [client, room, threadRoot])

	const onClick = (evt: React.MouseEvent<HTMLDivElement>) => {
		if (threadRoomCtx.focusedEventRowID) {
			threadRoomCtx.setFocusedEventRowID(null)
			evt.stopPropagation()
		}
	}
	const loadHistory = () => {
		setLoading(true)
		client.rpc.paginateManual(room.roomID, prevBatch, "b", { threadRoot })
			.then(res => {
				scrollFixRef.current = viewRef.current?.scrollHeight ?? null
				setPrevBatch(res.next_batch)
				setTimeline(currentTimeline => [
					...res.events.reverse().map(evt => room.applyEvent(evt)),
					...currentTimeline,
				])
			}, err => {
				console.error("Failed to load thread history", err)
			})
			.finally(() => setLoading(false))
	}
	const handleScroll = () => {
		if (!viewRef.current) {
			return
		}
		const tlView = viewRef.current
		threadRoomCtx.scrolledToBottom = tlView.scrollTop + tlView.clientHeight + 1 >= tlView.scrollHeight
	}

	useLayoutEffect(() => {
		if (bottomRef.current && threadRoomCtx.scrolledToBottom) {
			bottomRef.current.scrollIntoView()
		} else if (scrollFixRef.current && viewRef.current) {
			viewRef.current.scrollTop += viewRef.current.scrollHeight - scrollFixRef.current
		}
		scrollFixRef.current = null
	}, [timeline, threadRoomCtx])

	const prependRoot = rootEvent && !prevBatch && !loading
	const timelineDiv = <div className="timeline-view" ref={viewRef} onScroll={handleScroll}>
		{(prevBatch || loading) ? <div className="timeline-edge"><button onClick={loadHistory} disabled={loading}>
			{loading
				? <><ScaleLoader color="var(--primary-color)"/> Loading history...</>
				: "Load more history"}
		</button></div> : null}
		<div className="timeline-list">
			{prependRoot ? <TimelineEvent
				prevEvt={null}
				evt={rootEvent}
				smallReplies={smallReplies}
				isFocused={focusedEventRowID === rootEvent.rowid}
				threadView={true}
			/> : null}
			{renderTimelineList(timeline, {
				smallReplies,
				threadView: true,
				prevEventOverride: prependRoot ? rootEvent : undefined,
				focusedEventRowID,
			})}
			<div className="timeline-bottom-ref" ref={bottomRef}/>
		</div>
	</div>
	return <RoomContext value={threadRoomCtx}>
		<div className="thread-view" onClick={onClick}>
			{timelineDiv}
		</div>
	</RoomContext>
}

export default ThreadView
