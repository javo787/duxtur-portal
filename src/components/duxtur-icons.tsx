// components/duxtur-icons.tsx
export function CardioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M24 40S10 28 10 19a8 8 0 0 1 14-5.7A8 8 0 0 1 38 19c0 9-14 21-14 21z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 21h3l2-3 3 6 2-3h3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NeuroIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M24 6a12 12 0 0 0-12 12v24h24V18a12 12 0 0 0-12-12z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM30 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" />
      <path
        d="M16 30l4-4 4 4 4-4 4 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Твоя иконка зуба
export function DentalIcon({ className }: { className?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.9591 9.2814C16.6218 6.84016 12.7792 7.98807 9.58534 11.8657C6.50278 15.6083 8.60445 22.3544 10.1153 27.2039C10.4755 28.3602 10.8022 29.4087 11.0169 30.2829C12.1324 34.8237 13.1996 37.6532 15.6331 39.701C16.8383 40.715 18.2048 38.9724 19.6465 37.1338C20.8965 35.5398 22.203 33.8737 23.5098 33.8697C24.7954 33.8658 26.0812 35.5293 27.3138 37.1239C28.7366 38.9646 30.0886 40.7135 31.2874 39.701C33.1461 38.1311 33.9903 36.9793 35.0116 33.745C38.4562 32.8529 41 29.7235 41 26C41 24.1711 40.3863 22.4856 39.3536 21.138C40.3596 17.7171 40.4801 14.2345 37.5808 10.8727C33.4414 6.07315 27.704 8.55223 25.0332 10.1396L28.6508 13.2408C29.0701 13.6002 29.1187 14.2315 28.7592 14.6508C28.3998 15.0701 27.7685 15.1187 27.3492 14.7592L20.9591 9.2814ZM39 26C39 29.3137 36.3137 32 33 32C29.6863 32 27 29.3137 27 26C27 22.6863 29.6863 20 33 20C36.3137 20 39 22.6863 39 26ZM32 23C32 22.4477 32.4477 22 33 22C33.5523 22 34 22.4477 34 23V25H36C36.5523 25 37 25.4477 37 26C37 26.5523 36.5523 27 36 27H34V29C34 29.5523 33.5523 30 33 30C32.4477 30 32 29.5523 32 29V27H30C29.4477 27 29 26.5523 29 26C29 25.4477 29.4477 25 30 25H32V23Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PediaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M14 38a10 10 0 0 1 20 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 22v4M20 20l2 2M28 20l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Твоя иконка дерматологии
export function DermaIcon({ className }: { className?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M35.0843 38.1833C39.2942 34.8886 42 29.7603 42 24C42 16.1432 36.9663 9.46218 29.9479 7.00593L30.6088 5.1177C38.407 7.84687 44 15.2703 44 24C44 30.413 40.9816 36.1211 36.288 39.781L35.0843 38.1833Z"
        fill="currentColor"
      />
      <path
        d="M28.466 41.4417C27.0379 41.8062 25.5416 42 24 42C22.4922 42 21.0278 41.8146 19.6282 41.4654L19.1526 43.4086C20.7046 43.7949 22.3284 44 24 44C25.7055 44 27.3611 43.7865 28.9416 43.3849L28.466 41.4417Z"
        fill="currentColor"
      />
      <path
        d="M6 24C6 29.789 8.7328 34.9397 12.9787 38.2324L11.7751 39.83C7.04544 36.1722 4 30.4417 4 24C4 15.2703 9.59303 7.84687 17.3912 5.1177L18.0521 7.00593C11.0337 9.46218 6 16.1432 6 24Z"
        fill="currentColor"
      />
      <path
        d="M28.5 8.50001C28.5 10.9853 26.4853 13 24 13C21.5147 13 19.5 10.9853 19.5 8.50001C19.5 6.01779 21.5098 4.00497 23.9908 4.00002H24.0092C26.4902 4.00497 28.5 6.01779 28.5 8.50001Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 22C16.7286 22 17.4117 21.8052 18 21.4649V25.9851L17.9999 26V29C17.9999 28.9981 17.9999 28.997 17.9998 28.9967C17.9997 28.9965 17.9996 28.997 17.9993 28.9984L17.9977 29.0092C17.991 29.055 17.9657 29.2287 17.8732 29.5781C17.7678 29.9761 17.6095 30.4791 17.4068 31.0645C17.3711 31.1679 17.3341 31.2731 17.2962 31.38C15.9392 32.0198 15 33.4002 15 35C15 35.5221 15.1 36.0208 15.2819 36.478C14.9465 37.2745 14.6309 38.0072 14.3694 38.6077C14.1605 39.0873 13.9866 39.4816 13.8652 39.7553C13.8044 39.8922 13.7569 39.9989 13.7246 40.071L13.6761 40.1793C13.2535 41.1184 13.6131 42.2248 14.5069 42.7361C15.4008 43.2474 16.5368 42.9964 17.132 42.156L19.3801 38.9822C21.411 38.7907 23 37.0809 23 35C23 34.6679 22.9595 34.3452 22.8832 34.0366L24 32.4601L30.868 42.156C31.4632 42.9963 32.5992 43.2474 33.493 42.7361C34.3869 42.2248 34.7464 41.1184 34.3239 40.1793L34.2753 40.071C34.2431 39.9989 34.1955 39.8922 34.1348 39.7553C34.0133 39.4816 33.8394 39.0873 33.6305 38.6077C33.2124 37.6475 32.6561 36.3495 32.1011 34.9927C31.5441 33.6312 30.9974 32.2325 30.5931 31.0645C30.3905 30.4791 30.2321 29.9761 30.1268 29.5781C30.0343 29.2287 30.009 29.055 30.0023 29.0092C30.0016 29.0044 30.0011 29.0009 30.0007 28.9989C30.0002 28.9955 30 28.996 30 29L30 26.4649C31.1956 25.7733 32 24.4806 32 23C32 21.8053 31.4762 20.733 30.6458 20H36C37.1046 20 38 19.1046 38 18C38 16.8954 37.1046 16 36 16H19.4649C18.7733 14.8044 17.4806 14 16 14C14.5194 14 13.2267 14.8044 12.5351 16H12C10.8954 16 10 16.8954 10 18C10 19.1046 10.8954 20 12 20H12.5351C13.2267 21.1956 14.5194 22 16 22ZM18 18C18 19.1046 17.1046 20 16 20C14.8954 20 14 19.1046 14 18C14 16.8954 14.8954 16 16 16C17.1046 16 18 16.8954 18 18ZM30 23C30 24.1046 29.1046 25 28 25C26.8954 25 26 24.1046 26 23C26 21.8954 26.8954 21 28 21C29.1046 21 30 21.8954 30 23ZM21 35C21 36.1046 20.1046 37 19 37C17.8954 37 17 36.1046 17 35C17 33.8954 17.8954 33 19 33C20.1046 33 21 33.8954 21 35Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function OphthalmoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M8 24s7-14 16-14 16 14 16 14-7 14-16 14S8 24 8 24z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export function SurgeryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M14 10h20l4 6v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M20 20l4 4 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function GynecoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 8a12 12 0 0 0-8 21.2V40h6v-5h4v5h6V29.2A12 12 0 0 0 24 8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M18 20a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function GeneralIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="12" y="8" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M20 20h8M20 26h8M20 32h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="22" y="10" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}
