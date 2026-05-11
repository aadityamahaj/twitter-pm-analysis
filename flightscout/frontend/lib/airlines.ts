import { Airline } from '@/types';

export const AIRLINES: Airline[] = [
  { iata: 'AA', name: 'American Airlines', alliance: 'Oneworld' },
  { iata: 'UA', name: 'United Airlines', alliance: 'Star Alliance' },
  { iata: 'DL', name: 'Delta Air Lines', alliance: 'SkyTeam' },
  { iata: 'WN', name: 'Southwest Airlines', alliance: null },
  { iata: 'B6', name: 'JetBlue Airways', alliance: null },
  { iata: 'AS', name: 'Alaska Airlines', alliance: 'Oneworld' },
  { iata: 'NK', name: 'Spirit Airlines', alliance: null },
  { iata: 'F9', name: 'Frontier Airlines', alliance: null },
  { iata: 'G4', name: 'Allegiant Air', alliance: null },
  { iata: 'SY', name: 'Sun Country Airlines', alliance: null },
  { iata: 'BA', name: 'British Airways', alliance: 'Oneworld' },
  { iata: 'LH', name: 'Lufthansa', alliance: 'Star Alliance' },
  { iata: 'AF', name: 'Air France', alliance: 'SkyTeam' },
  { iata: 'KL', name: 'KLM Royal Dutch Airlines', alliance: 'SkyTeam' },
  { iata: 'EK', name: 'Emirates', alliance: null },
  { iata: 'QR', name: 'Qatar Airways', alliance: 'Oneworld' },
  { iata: 'EY', name: 'Etihad Airways', alliance: null },
  { iata: 'SQ', name: 'Singapore Airlines', alliance: 'Star Alliance' },
  { iata: 'CX', name: 'Cathay Pacific', alliance: 'Oneworld' },
  { iata: 'NH', name: 'All Nippon Airways', alliance: 'Star Alliance' },
  { iata: 'JL', name: 'Japan Airlines', alliance: 'Oneworld' },
  { iata: 'KE', name: 'Korean Air', alliance: 'SkyTeam' },
  { iata: 'OZ', name: 'Asiana Airlines', alliance: 'Star Alliance' },
  { iata: 'CA', name: 'Air China', alliance: 'Star Alliance' },
  { iata: 'MU', name: 'China Eastern Airlines', alliance: 'SkyTeam' },
  { iata: 'QF', name: 'Qantas', alliance: 'Oneworld' },
  { iata: 'AC', name: 'Air Canada', alliance: 'Star Alliance' },
  { iata: 'TK', name: 'Turkish Airlines', alliance: 'Star Alliance' },
  { iata: 'IB', name: 'Iberia', alliance: 'Oneworld' },
  { iata: 'AZ', name: 'ITA Airways', alliance: 'SkyTeam' },
  { iata: 'FR', name: 'Ryanair', alliance: null },
  { iata: 'U2', name: 'easyJet', alliance: null },
  { iata: 'VY', name: 'Vueling Airlines', alliance: 'Oneworld' },
  { iata: 'LX', name: 'Swiss International Air Lines', alliance: 'Star Alliance' },
  { iata: 'OS', name: 'Austrian Airlines', alliance: 'Star Alliance' },
  { iata: 'SK', name: 'Scandinavian Airlines', alliance: 'Star Alliance' },
  { iata: 'AY', name: 'Finnair', alliance: 'Oneworld' },
  { iata: 'TP', name: 'TAP Air Portugal', alliance: 'Star Alliance' },
  { iata: 'AI', name: 'Air India', alliance: 'Star Alliance' },
  { iata: 'SV', name: 'Saudia', alliance: 'SkyTeam' },
];

const airlineMap = new Map(AIRLINES.map(a => [a.iata, a]));

export function getAirline(iata: string): Airline | undefined {
  return airlineMap.get(iata.toUpperCase());
}

export function getAirlineLogo(iata: string): string {
  return `https://logo.clearbit.com/${getAirlineDomain(iata)}`;
}

function getAirlineDomain(iata: string): string {
  const domains: Record<string, string> = {
    AA: 'aa.com', UA: 'united.com', DL: 'delta.com', WN: 'southwest.com',
    B6: 'jetblue.com', AS: 'alaskaair.com', NK: 'spirit.com', F9: 'flyfrontier.com',
    BA: 'britishairways.com', LH: 'lufthansa.com', AF: 'airfrance.com',
    KL: 'klm.com', EK: 'emirates.com', QR: 'qatarairways.com', EY: 'etihad.com',
    SQ: 'singaporeair.com', CX: 'cathaypacific.com', NH: 'ana.co.jp',
    JL: 'jal.com', KE: 'koreanair.com', QF: 'qantas.com', AC: 'aircanada.com',
    TK: 'turkishairlines.com', FR: 'ryanair.com', U2: 'easyjet.com',
  };
  return domains[iata] ?? `${iata.toLowerCase()}.com`;
}

// Airline quality ranking for scoring (higher = better for most travelers)
export const AIRLINE_QUALITY: Record<string, number> = {
  SQ: 98, QR: 97, EK: 95, CX: 94, NH: 93, JL: 92, LX: 90, QF: 89,
  BA: 87, LH: 86, KL: 85, AF: 84, AS: 83, AC: 82, UA: 80, AA: 79,
  DL: 78, SK: 77, AY: 76, TK: 75, B6: 74, WN: 70, NK: 45, F9: 43, G4: 40,
};
