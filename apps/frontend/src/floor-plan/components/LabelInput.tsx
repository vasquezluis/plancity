type Props = {
  x: number;
  y: number;
  value: string;
  onChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Inline text input rendered inside a foreignObject for placing a room label. */
export function LabelInput({ x, y, value, onChange, onConfirm, onCancel }: Props) {
  return (
    <foreignObject x={x} y={y - 22} width={200} height={28}>
      <div>
        <input
          // biome-ignore lint/a11y/noAutofocus: intentional — user just clicked to place a label
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          onBlur={onConfirm}
          placeholder="Room name…"
          style={{
            width: '100%',
            fontSize: '13px',
            fontWeight: 600,
            padding: '2px 6px',
            border: '1.5px solid #6b21a8',
            borderRadius: '4px',
            outline: 'none',
            background: 'white',
            color: '#6b21a8',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </foreignObject>
  );
}
