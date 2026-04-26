// functions/_shared/supabase.js
// Thin helper that calls Supabase REST API directly — no npm package needed.

export function supabaseClient(env) {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY

  const headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  }

  return {
    async select(table, filters = {}, columns = '*', options = {}) {
      let qs = `select=${columns}`
      for (const [k, v] of Object.entries(filters)) {
        if (typeof v === 'object' && v.neq !== undefined) {
          qs += `&${k}=neq.${v.neq}`
        } else {
          qs += `&${k}=eq.${v}`
        }
      }
      const hasCreatedAt = !['site_settings'].includes(table)
      if (!options.noOrder && hasCreatedAt) qs += '&order=created_at.desc'
      if (options.limit != null) qs += `&limit=${options.limit}`
      if (options.offset != null) qs += `&offset=${options.offset}`
      const reqHeaders = options.count
        ? { ...headers, 'Prefer': 'count=exact' }
        : headers
      const res = await fetch(`${url}/rest/v1/${table}?${qs}`, { headers: reqHeaders })
      const data = await res.json()
      if (options.count) {
        const range = res.headers.get('Content-Range') // e.g. "0-9/42"
        const total = range ? parseInt(range.split('/')[1], 10) : null
        return { data, total }
      }
      return data
    },

    async insert(table, data) {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      const json = await res.json()
      return Array.isArray(json) ? json[0] : json
    },

    async update(table, data, id) {
      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      })
      return res.ok
    },

    async delete(table, id) {
      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      })
      return res.ok
    },

    storage: {
      async upload(bucket, path, buffer, contentType) {
        const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': contentType,
          },
          body: buffer,
        })
        return res.ok
      },

      async download(bucket, path) {
        const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
        })
        if (!res.ok) return null
        return res.arrayBuffer()
      }
    }
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}

export function error(message, status = 500) {
  return json({ error: message }, status)
}

export function checkMethod(request, allowed) {
  if (!allowed.includes(request.method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }
  return null
}
