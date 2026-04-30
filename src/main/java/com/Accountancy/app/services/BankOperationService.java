package com.Accountancy.app.services;

import com.Accountancy.app.dto.BankOperationDTO.*;
import com.Accountancy.app.entities.*;
import com.Accountancy.app.entities.BankOperation.OperationType;
import com.Accountancy.app.entities.JournalEntry.JournalStatus;
import com.Accountancy.app.repositories.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BankOperationService {

    private final BankOperationRepository bankOperationRepository;
    private final BankAccountRepository bankAccountRepository;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalLineRepository journalLineRepository;
    private final UserRepository userRepository;

    public BankOperationService(BankOperationRepository bankOperationRepository,
                                BankAccountRepository bankAccountRepository,
                                AccountRepository accountRepository,
                                JournalEntryRepository journalEntryRepository,
                                JournalLineRepository journalLineRepository,
                                UserRepository userRepository) {
        this.bankOperationRepository = bankOperationRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.accountRepository = accountRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalLineRepository = journalLineRepository;
        this.userRepository = userRepository;
    }

    public List<BankOperationResponse> getAllByBankAccount(Integer bankAccountId) {
        return bankOperationRepository.findByBankAccountId(bankAccountId)
                .stream().map(this::toResponse).toList();
    }

    public List<BankOperationResponse> getAll() {
        return bankOperationRepository.findAll()
                .stream().map(this::toResponse).toList();
    }

    // Creeaza o operatiune de banca si posteaza nota contabila automat
    // Tipuri predefinite cu formule fixe:
    //   COMMISSION:        DR 627  = CR 5121  (Comision bancar)
    //   SUPPLIER_PAYMENT:  DR 401  = CR 5121  (Plata furnizor)
    //   CLIENT_RECEIPT:    DR 5121 = CR 4111  (Incasare client)
    //   INTEREST_EXP:      DR 666  = CR 5121  (Dobanda platita)
    //   INTEREST_INC:      DR 5121 = CR 766   (Dobanda incasata)
    //   OTHER:             DR ales = CR ales  (Alta operatiune)
    @Transactional
    public BankOperationResponse createOperation(BankOperationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        BankAccount bankAccount = bankAccountRepository.findById(request.bankAccountId())
                .orElseThrow(() -> new RuntimeException("Contul bancar nu exista: " + request.bankAccountId()));

        Account debitAccount;
        Account creditAccount;

        switch (request.operationType()) {
            case COMMISSION -> {
                // DR 627 Cheltuieli servicii bancare = CR 5121 Conturi la banci
                debitAccount  = getAccount("627");
                creditAccount = getAccount("5121");
            }
            case SUPPLIER_PAYMENT -> {
                // DR 401 Furnizori = CR 5121 Conturi la banci
                debitAccount  = getAccount("401");
                creditAccount = getAccount("5121");
            }
            case CLIENT_RECEIPT -> {
                // DR 5121 Conturi la banci = CR 4111 Clienti
                debitAccount  = getAccount("5121");
                creditAccount = getAccount("4111");
            }
            case INTEREST_EXP -> {
                // DR 666 Cheltuieli dobânzi = CR 5121 Conturi la banci
                debitAccount  = getAccount("666");
                creditAccount = getAccount("5121");
            }
            case INTEREST_INC -> {
                // DR 5121 Conturi la banci = CR 766 Venituri din dobânzi
                debitAccount  = getAccount("5121");
                creditAccount = getAccount("766");
            }
            default -> {
                // OTHER — userul alege manual DR si CR
                if (request.debitAccountId() == null || request.creditAccountId() == null) {
                    throw new RuntimeException("Pentru operatiuni de tip OTHER trebuie specificat contul de debit si credit");
                }
                debitAccount  = accountRepository.findById(request.debitAccountId())
                        .orElseThrow(() -> new RuntimeException("Contul de debit nu exista: " + request.debitAccountId()));
                creditAccount = accountRepository.findById(request.creditAccountId())
                        .orElseThrow(() -> new RuntimeException("Contul de credit nu exista: " + request.creditAccountId()));
            }
        }

        BankOperation operation = BankOperation.builder()
                .bankAccount(bankAccount)
                .user(user)
                .debitAccount(debitAccount)
                .creditAccount(creditAccount)
                .operationType(request.operationType())
                .description(request.description())
                .amount(request.amount())
                .operationDate(request.operationDate())
                .build();

        BankOperation saved = bankOperationRepository.save(operation);
        postJournalEntry(saved, user);

        return toResponse(bankOperationRepository.save(saved));
    }

    private Account getAccount(String code) {
        return accountRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Contul " + code + " nu exista in planul de conturi"));
    }

    private void postJournalEntry(BankOperation operation, User user) {
        String refNumber = "BANK-" + operation.getId() + "-" + operation.getOperationDate();

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .referenceNumber(refNumber)
                .entryDate(operation.getOperationDate())
                .description(operation.getDescription())
                .status(JournalStatus.POSTED)
                .build();

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(operation.getDebitAccount())
                .debitAmount(operation.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .description(operation.getDescription())
                .build());

        journalLineRepository.save(JournalLine.builder()
                .journalEntry(savedEntry)
                .account(operation.getCreditAccount())
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(operation.getAmount())
                .description(operation.getDescription())
                .build());

        operation.setJournalEntry(savedEntry);
    }

    private BankOperationResponse toResponse(BankOperation op) {
        return new BankOperationResponse(
                op.getId(),
                op.getBankAccount().getId(),
                op.getBankAccount().getAccountName(),
                op.getOperationType(),
                op.getDebitAccount().getId(),
                op.getDebitAccount().getCode(),
                op.getDebitAccount().getName(),
                op.getCreditAccount().getId(),
                op.getCreditAccount().getCode(),
                op.getCreditAccount().getName(),
                op.getDescription(),
                op.getAmount(),
                op.getOperationDate(),
                op.getJournalEntry() != null ? op.getJournalEntry().getReferenceNumber() : null,
                op.getCreatedAt()
        );
    }
}