import http from "http"

export interface WebRequest {
    headers: http.IncomingHttpHeaders,
}

export interface WebResponse {
    body?: string | object
    headers?: http.OutgoingHttpHeaders
}

