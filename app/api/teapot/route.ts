import { NextResponse } from 'next/server'

export async function POST() {
  return new NextResponse('I am a teapot', { status: 418 })
}

// 403
// {
//   "detail": "Siempre es bueno un atajo, pero no en este caso."
// }

// 200 -:00
// {"response":
// "¡Bienvenido al desafío de Altwarts! Tienes suerte, aquí está la primera pista."
// }

//  access-control-allow-headers: Authorization,Content-Type
//  access-control-allow-methods: POST,GET,PUT,DELETE,OPTIONS
//  access-control-allow-origin: *
//  cache-control: private
//  content-length: 97
//  content-type: application/json
//  date: Wed,19 Feb 2025 20:38:00 GMT
//  expires: Wed,19 Feb 2025 20:38:00 GMT
//  server: Google Frontend
//  x-cloud-trace-context: bdaa5013093a016f862d508b57901a79

//200 -:01
// {
//   "response": "Correcto, pero aún tienes un camino por recorrer."
// }
// access-control-allow-headers: Authorization,Content-Type
// access-control-allow-methods: POST,GET,PUT,DELETE,OPTIONS
// access-control-allow-origin: *
// cache-control: private
// content-length: 65
// content-type: application/json
// date: Wed,19 Feb 2025 20:40:01 GMT
// expires: Wed,19 Feb 2025 20:40:01 GMT
// server: Google Frontend
// x-cloud-trace-context: 0ebe54642f3e0ef578de17d7de8262b3;o=1

// 200 -:02
// {
//   "response": "Correcto, pero aún tienes un camino por recorrer."
// }
// access-control-allow-headers: Authorization,Content-Type
// access-control-allow-methods: POST,GET,PUT,DELETE,OPTIONS
// access-control-allow-origin: *
// cache-control: private
// content-length: 65
// content-type: application/json
// date: Wed,19 Feb 2025 20:41:02 GMT
// expires: Wed,19 Feb 2025 20:41:02 GMT
// server: Google Frontend
// x-cloud-trace-context: 105df13d871ef0cc226135ae9db02c46;o=1

//200 -:03
// {
//   "response": "Correcto, pero aún tienes un camino por recorrer."
// }
// access-control-allow-headers: Authorization,Content-Type
// access-control-allow-methods: POST,GET,PUT,DELETE,OPTIONS
// access-control-allow-origin: *
// cache-control: private
// content-length: 65
// content-type: application/json
// date: Wed,19 Feb 2025 20:42:03 GMT
// expires: Wed,19 Feb 2025 20:42:03 GMT
// server: Google Frontend
// x-cloud-trace-context: 645fc30813244dfe5c0b49c8800514f7;o=1

//200 -:04
// {
//   "response": "Has llegado al final. Recuerda usar el hechizo 'revelio' para descubrir el mensaje oculto."
// }
//  access-control-allow-headers: Authorization,Content-Type
//  access-control-allow-methods: POST,GET,PUT,DELETE,OPTIONS
//  access-control-allow-origin: *
//  content-length: 105
//  content-type: application/json
//  date: Wed,19 Feb 2025 20:46:50 GMT
//  server: Google Frontend
//  x-cloud-trace-context: 337bdb3bc3c5af3c2cb3905f7936224c;o=1
