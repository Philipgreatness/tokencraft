;; TokenCraft Custom Token Contract
;; A flexible, secure SIP-010 compatible fungible token implementation

;; Implement SIP-010 trait
;; We'll define our own SIP-010 trait locally
(define-trait sip-010-trait
  (
    ;; Transfer tokens
    (transfer-fixed (uint principal principal (optional (buff 34))) (response bool uint))
    
    ;; Token metadata
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 10) uint))
    (get-decimals () (response uint uint))
    
    ;; Balance and supply
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
  )
)

;; Contract Owner
(define-data-var contract-owner principal tx-sender)

;; Error Codes
(define-constant ERR_UNAUTHORIZED u1001)
(define-constant ERR_INSUFFICIENT_BALANCE u1002)
(define-constant ERR_INVALID_AMOUNT u1003)
(define-constant ERR_CONTRACT_PAUSED u1004)

;; Token Metadata
(define-data-var token-name (string-ascii 32) "TokenCraft")
(define-data-var token-symbol (string-ascii 10) "TCRAFT")
(define-data-var token-decimals uint u8)

;; Roles and Permissions
(define-map roles 
  { 
    role-type: (string-ascii 20), 
    principal: principal 
  }
  { 
    authorized: bool 
  }
)

;; Pausing Mechanism
(define-data-var contract-paused bool false)

;; Token Balance Map
(define-map balances principal uint)

;; Total Supply
(define-data-var total-supply uint u0)

;; Authorization Checks
(define-private (is-authorized (role-type (string-ascii 20)))
  (is-some 
    (map-get? roles 
      { 
        role-type: role-type, 
        principal: tx-sender 
      }
    )
  )
)

;; Set Role Authorization
(define-public (set-role (role-type (string-ascii 20)) (user principal) (authorized bool))
  (begin
    ;; Only contract owner can set roles
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    (map-set roles { role-type: role-type, principal: user } { authorized: authorized })
    (ok true)
  )
)

;; Pause/Unpause Contract
(define-public (set-pause-status (paused bool))
  (begin
    ;; Only contract owner can pause/unpause
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    (var-set contract-paused paused)
    (ok true)
  )
)

;; Token Minting Function
(define-public (mint (amount uint) (recipient principal))
  (begin
    ;; Check contract is not paused
    (asserts! (not (var-get contract-paused)) (err ERR_CONTRACT_PAUSED))
    
    ;; Only minters can mint
    (asserts! (is-authorized "minter") (err ERR_UNAUTHORIZED))
    
    ;; Validate mint amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Update balance and total supply
    (let 
      (
        (current-balance (default-to u0 (map-get? balances recipient)))
        (new-balance (+ current-balance amount))
      )
      (map-set balances recipient new-balance)
      (var-set total-supply (+ (var-get total-supply) amount))
      (ok true)
    )
  )
)

;; Token Burning Function
(define-public (burn (amount uint))
  (begin
    ;; Check contract is not paused
    (asserts! (not (var-get contract-paused)) (err ERR_CONTRACT_PAUSED))
    
    ;; Only burners can burn
    (asserts! (is-authorized "burner") (err ERR_UNAUTHORIZED))
    
    ;; Validate burn amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Get current balance
    (let 
      (
        (current-balance (default-to u0 (map-get? balances tx-sender)))
      )
      ;; Check sufficient balance
      (asserts! (>= current-balance amount) (err ERR_INSUFFICIENT_BALANCE))
      
      ;; Update balance and total supply
      (map-set balances tx-sender (- current-balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (ok true)
    )
  )
)

;; Token Transfer Function
(define-public (transfer (amount uint) (recipient principal))
  (begin
    ;; Check contract is not paused
    (asserts! (not (var-get contract-paused)) (err ERR_CONTRACT_PAUSED))
    
    ;; Validate transfer amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Get sender's current balance
    (let 
      (
        (current-balance (default-to u0 (map-get? balances tx-sender)))
      )
      ;; Check sufficient balance
      (asserts! (>= current-balance amount) (err ERR_INSUFFICIENT_BALANCE))
      
      ;; Update sender and recipient balances
      (map-set balances tx-sender (- current-balance amount))
      (map-set balances recipient 
        (+ (default-to u0 (map-get? balances recipient)) amount)
      )
      (ok true)
    )
  )
)

;; Read-Only Functions for Token Metadata
(define-read-only (get-name)
  (var-get token-name)
)

(define-read-only (get-symbol)
  (var-get token-symbol)
)

(define-read-only (get-decimals)
  (var-get token-decimals)
)

(define-read-only (get-balance (user principal))
  (default-to u0 (map-get? balances user))
)

(define-read-only (get-total-supply)
  (var-get total-supply)
)

;; Optional: Transfer Function Adherence to SIP-010 Trait
(define-public (transfer-fixed 
  (amount uint) 
  (sender principal) 
  (recipient principal) 
  (memo (optional (buff 34)))
)
  (begin
    ;; Ensure sender is tx-sender
    (asserts! (is-eq sender tx-sender) (err ERR_UNAUTHORIZED))
    (transfer amount recipient)
  )
)