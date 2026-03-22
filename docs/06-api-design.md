# API Design

## Endpoint

POST /generate-layout

---

## Request

```json
{
  "floorplan": {},
  "preferences": {
    "outlet_spacing": 3,
    "optimization": "min_cost"
  }
}
```

## Response

```json
{
  "layout": {},
  "metrics": {
    "total_wire_length": 42
  }
}
```

## Notes

- Stateless API
- JSON only
- Rate limiting -> 3 requests per minute
