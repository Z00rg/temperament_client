import {Patient} from "@/shared/api/patientApi";

type PatientCardProps = {
    patient: Patient;
    actions?: React.ReactNode;
};

export function PatientCard({ patient, actions }: PatientCardProps) {
    const fullName = patient.fio;

    return (
        <div className="bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex-shrink-0">
                    Карточка пациента
                </h2>
                {actions && (
                    <div className="flex space-x-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        ФИО
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800 break-words">
                        {fullName}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Дата рождения
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800">
                        {patient.birth_date}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Пол
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800">
                        {patient.gender === 0 ? "Мужской" : "Женский"}
                    </p>
                </div>
            </div>
        </div>
    );
}