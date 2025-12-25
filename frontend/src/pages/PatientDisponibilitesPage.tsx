import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Disponibilite, User } from '../types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PatientDisponibilitesPage = () => {
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>('all');
  const [isMedecinDropdownOpen, setIsMedecinDropdownOpen] = useState(false);
  const medecinDropdownRef = useRef<HTMLDivElement>(null);

  // Récupérer tous les médecins (exclure les admins)
  const { data: medecins } = useQuery({
    queryKey: ['medecins'],
    queryFn: async () => {
      const response = await api.get('/medecins');
      const allUsers = response.data.data as User[];
      // Filtrer pour ne garder que les médecins (exclure les admins)
      return allUsers.filter((user) => user.userRole === 'medecin');
    },
  });

  // Récupérer toutes les disponibilités (exclure celles des admins)
  const { data: disponibilites, isLoading } = useQuery({
    queryKey: ['disponibilites', selectedMedecinId],
    queryFn: async () => {
      const response = await api.get('/disponibilites');
      const allDisponibilites = response.data.data as (Disponibilite & {
        user: {
          id: string;
          nom: string;
          prenom: string;
          specialite: string;
          userRole?: string;
        };
      })[];
      // Filtrer pour exclure les disponibilités des admins et ne garder que celles disponibles
      return allDisponibilites.filter(
        (disp) => disp.user && disp.user.userRole !== 'admin' && disp.estDisponible
      );
    },
  });

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (medecinDropdownRef.current && !medecinDropdownRef.current.contains(event.target as Node)) {
        setIsMedecinDropdownOpen(false);
      }
    };

    if (isMedecinDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMedecinDropdownOpen]);

  // Filtrer les disponibilités par médecin
  const filteredDisponibilites = disponibilites?.filter((disp) => {
    if (selectedMedecinId === 'all') return true;
    return disp.userId === selectedMedecinId;
  });

  // Grouper les disponibilités par médecin (exclure les admins)
  const disponibilitesByMedecin = filteredDisponibilites
    ?.filter((disp) => disp.user && disp.user.userRole !== 'admin') // Double vérification pour exclure les admins et les disponibilités sans user
    .reduce((acc, disp) => {
      if (!disp.user) return acc; // Sécurité supplémentaire
      const medecinKey = `${disp.user.prenom} ${disp.user.nom}`;
      if (!acc[medecinKey]) {
        acc[medecinKey] = {
          medecin: disp.user,
          disponibilites: [],
        };
      }
      acc[medecinKey].disponibilites.push(disp);
      return acc;
    }, {} as Record<string, { medecin: { id: string; nom: string; prenom: string; specialite: string; userRole?: string }; disponibilites: typeof filteredDisponibilites }>);

  const selectedMedecin = medecins?.find((m) => m.id === selectedMedecinId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Disponibilités des médecins</h1>
          <p className="text-gray-600 mt-2">Consultez les disponibilités de tous les médecins</p>
        </div>
      </div>

      {/* Filtre par médecin */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative" ref={medecinDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par médecin</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMedecinDropdownOpen(!isMedecinDropdownOpen)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-primary-500 transition-colors"
            >
              <span className={selectedMedecinId !== 'all' ? 'text-gray-900' : 'text-gray-500'}>
                {selectedMedecinId === 'all'
                  ? 'Tous les médecins'
                  : selectedMedecin
                    ? `Dr. ${selectedMedecin.prenom} ${selectedMedecin.nom} - ${selectedMedecin.specialite}`
                    : 'Sélectionner un médecin'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isMedecinDropdownOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMedecinDropdownOpen && (
              <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMedecinId('all');
                    setIsMedecinDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                    selectedMedecinId === 'all' ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                  }`}
                >
                  Tous les médecins
                </button>
                {medecins?.map((medecin) => (
                  <button
                    key={medecin.id}
                    type="button"
                    onClick={() => {
                      setSelectedMedecinId(medecin.id);
                      setIsMedecinDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                      selectedMedecinId === medecin.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-900'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Dr. {medecin.prenom} {medecin.nom}
                      </span>
                      <span className="text-xs text-gray-500">{medecin.specialite}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des disponibilités groupées par médecin */}
      {disponibilitesByMedecin && Object.keys(disponibilitesByMedecin).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(disponibilitesByMedecin).map(([, data]) => (
            <div key={data.medecin.id} className="card">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Dr. {data.medecin.prenom} {data.medecin.nom}
                </h2>
                <p className="text-sm text-gray-500">{data.medecin.specialite}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Heures
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Durée consultation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.disponibilites.map((disp) => (
                      <tr key={disp.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          {disp.dateSpecifique
                            ? new Date(disp.dateSpecifique).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {disp.heureDebut} - {disp.heureFin}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {disp.dureeConsultation} min
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {disp.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {selectedMedecinId === 'all'
              ? 'Aucune disponibilité enregistrée pour le moment.'
              : 'Ce médecin n\'a pas de disponibilités enregistrées.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientDisponibilitesPage;

