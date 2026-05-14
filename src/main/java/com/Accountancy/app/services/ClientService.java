package com.Accountancy.app.services;

import com.Accountancy.app.dto.ClientDTO.ClientRequest;
import com.Accountancy.app.dto.ClientDTO.ClientResponse;
import com.Accountancy.app.entities.Client;
import com.Accountancy.app.entities.Company;
import com.Accountancy.app.repositories.ClientRepository;
import com.Accountancy.app.repositories.CompanyRepository;
import com.Accountancy.app.security.CompanyContext;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;
    private final CompanyContext companyContext;

    public ClientService(ClientRepository clientRepository,
                         CompanyRepository companyRepository,
                         CompanyContext companyContext) {
        this.clientRepository = clientRepository;
        this.companyRepository = companyRepository;
        this.companyContext = companyContext;
    }

    public List<ClientResponse> getAllClients() {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return clientRepository.findByIsActiveTrueAndCompany_Id(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ClientResponse getClientById(Integer id) {
        return toResponse(findById(id));
    }

    public List<ClientResponse> searchClients(String name) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return clientRepository.findByNameContainingIgnoreCaseAndCompany_Id(name, companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ClientResponse createClient(ClientRequest request) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        Company company = findCompany(companyId);

        Client client = Client.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .taxId(request.taxId())
                .company(company)
                .isActive(true)
                .build();

        return toResponse(clientRepository.save(client));
    }

    public ClientResponse updateClient(Integer id, ClientRequest request) {
        Client client = findById(id);

        client.setName(request.name());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setAddress(request.address());
        client.setTaxId(request.taxId());

        return toResponse(clientRepository.save(client));
    }

    public void deactivateClient(Integer id) {
        Client client = findById(id);
        client.setIsActive(false);
        clientRepository.save(client);
    }

    // ── Helpers ──────────────────────────────────────────────────

    /**
     * Secure fetch — throws 404 if the client doesn't exist OR doesn't
     * belong to the current company. Prevents cross-company data access.
     */
    private Client findById(Integer id) {
        Integer companyId = companyContext.requireCurrentCompanyId();
        return clientRepository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + id));
    }

    private Company findCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
    }

    private ClientResponse toResponse(Client client) {
        return new ClientResponse(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getPhone(),
                client.getAddress(),
                client.getTaxId(),
                client.getIsActive(),
                client.getCreatedAt()
        );
    }
}