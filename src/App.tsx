import { useState, useEffect } from 'react';

type PokemonData = Record<string, unknown>;

export default function App() {
  // Datenbank aus JSON
  const [database, setDatabase] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Zustand der App
  const [inputName, setInputName] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<PokemonData[]>([]);
  // Speichert die IDs/Indizes der Zeilen, die hervorgehoben (gestylt) sind
  const [highlightedRows, setHighlightedRows] = useState<Record<number, boolean>>({});

  // 1. Datenbank laden
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/database.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP-Fehler! Status: ${res.status}`);
        return res.json();
      })
      .then((jsonData: PokemonData[]) => {
        setDatabase(jsonData);
        setLoading(false);

        // ZUM TESTEN: Zeigt dir die exakten Feldnamen der ersten Datenzeile an
        if (jsonData.length > 0) {
          console.log('📌 Verfügbare Spalten in deiner Datenbank:', Object.keys(jsonData[0]));
          console.log('📌 Beispiel-Datensatz:', jsonData[0]);
        }
      })
      .catch((err: Error) => {
        console.error('Fehler beim Laden:', err);
        setError(`Datenbank konnte nicht geladen werden (${err.message}).`);
        setLoading(false);
      });
  }, []);

  // Hilfsfunktion zur Textausgabe
  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // 2. Pokémon anhand der Eingabe suchen und zur Tabelle hinzufügen
  const handleAddPokemon = (pokemonToAdd?: PokemonData) => {
    let target = pokemonToAdd;

    // Falls kein direktes Objekt übergeben wurde, suchen wir nach der Texteingabe
    if (!target && inputName.trim() !== '') {
      target = database.find((p) => {
        const name = String(p.name || p.Name || p.Pokemon || '');
        return name.toLowerCase() === inputName.trim().toLowerCase();
      });
    }

    if (target) {
      setSelectedTeam((prev) => [...prev, target]);
      setInputName(''); // Eingabefeld leeren
    } else {
      alert('Pokémon wurde in der Datenbank nicht gefunden!');
    }
  };

  // 3. Stil einer Tabellenzeile umschalten (Toggle)
  const toggleRowHighlight = (index: number) => {
    setHighlightedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 4. Ausgabetabelle leeren
  const handleReset = () => {
    setSelectedTeam([]);
    setHighlightedRows({});
  };

  // Dynamische Ermittlung der Tabellenspalten aus den Datenbankfeldern
  const columns = database.length > 0 ? Object.keys(database[0]) : [];

  if (loading) return <div style={{ padding: '2rem' }}>Datenbank wird geladen...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  // --- HILFSFUNKTIONEN FÜR DIE AUTO-VERVOLLSTÄNDIGUNG UND NAMENSERKENNUNG ---
    // 1. Hilfsfunktion: Versucht den Namen aus dem Pokémon-Objekt zu extrahieren
    const getPokemonName = (pokemon: PokemonData): string => {
      // Sucht nach typischen Spaltennamen für den Namen
      const possibleName = pokemon.Name || pokemon.name || pokemon.Pokemon || pokemon.pokemon || pokemon.Name_DE;
      if (possibleName) return String(possibleName);

      // Falls kein Standard-Feld passt, nimm den ersten Text-Wert im Objekt
      const firstStringValue = Object.values(pokemon).find((v) => typeof v === 'string');
      return firstStringValue ? String(firstStringValue) : '';
    };

    // 2. Erstellt eine Liste aller eindeutigen Namen für die Vorschläge
    const allNames = Array.from(
      new Set(database.map(getPokemonName).filter((name) => name !== ''))
    );

  //Hilffunktion zur Sortierung nach Nummer
    // 1. Hilfsfunktion zur Ermittlung der Nummer für die Sortierung
    const getPokemonNumber = (pokemon: PokemonData): number => {
      // Sucht nach typischen Spaltennamen für die Nummer
      const val = pokemon.Nummer ?? pokemon.nummer ?? pokemon.Nr ?? pokemon.nr ?? pokemon.ID ?? pokemon.id;
      const num = Number(val);
      // Falls keine gültige Zahl gefunden wurde (z. B. '-'), am Ende einsortieren
      return isNaN(num) ? Infinity : num;
    };

    // 2. Erstellt eine nach der Spalte 'Nummer' sortierte Kopie der ausgewählten Pokémon
    const sortedTeam = [...selectedTeam].sort((a, b) => getPokemonNumber(a) - getPokemonNumber(b));

  return (
    <div style={{ maxWidth: '95vw', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h1>Pokennection Hilfsprogramm</h1>

      {/* --- EINGABEMASKE MIT AUTO-VERVOLLSTÄNDIGUNG --- */}
      <div style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            // Verbindet das Input-Feld über das list-Attribut mit der datalist-ID unten
            list="pokemon-suggestions"
            placeholder="Pokémon-Name eingeben (z. B. Turtok)..."
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPokemon()}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />

          {/* Das native Datalist-Element mit allen Datenbank-Namen */}
          <datalist id="pokemon-suggestions">
            {allNames.map((name, index) => (
              <option key={`opt-${index}`} value={name} />
            ))}
          </datalist>

          <button
            onClick={() => handleAddPokemon()}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* --- AKTIONEN --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', overflowX: 'hidden' }}>
        <p style={{ margin: 0, color: '#555' }}>
          Ausgewählte Pokémon: <strong>{selectedTeam.length}</strong> (Klicke auf eine Zeile, um sie hervorzuheben)
        </p>

        {selectedTeam.length > 0 && (
          <button
            onClick={handleReset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Tabelle leeren
          </button>
        )}
      </div>

      {/* --- AUSGABETABELLE MIT FIXIERTEM KOPF --- */}
      <div
        style={{
          maxHeight: '600px', // Höhe für Scrollbereich
          overflowY: 'auto',   // Scrollbar aktivieren
          // overflowX: 'auto',   // Horizontales Scrollen bei Bedarf
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          width: '100%',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={`head-${col}`}
                  style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#1e293b',
                    color: 'white',
                    padding: '0.4rem 0.5rem',
                    zIndex: 1,
                    textTransform: 'capitalize',
                    wordBreak: 'break-word',
                    fontSize: '0.85rem'
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTeam.map((pokemon, rowIndex) => {
              const isHighlighted = highlightedRows[rowIndex];

              return (
                <tr
                  key={`team-row-${rowIndex}`}
                  onClick={() => toggleRowHighlight(rowIndex)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0',
                    // Stil-Umschaltung bei Klick (Hintergrund + Textfarbe/Schriftstil)
                    backgroundColor: isHighlighted ? '#fef08a' : rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                    fontWeight: isHighlighted ? 'bold' : 'normal',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {columns.map((col) => (
                    <td style={{ padding: '0.4rem 0.5rem', wordBreak: 'break-word', fontSize: '0.85rem' }} key={`cell-${rowIndex}-${col}`}>
                      {renderValue(pokemon[col])}
                    </td>
                  ))}
                </tr>
              );
            })}

            {selectedTeam.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}
                >
                  Noch keine Pokémon hinzugefügt. Gib oben einen Namen ein!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}