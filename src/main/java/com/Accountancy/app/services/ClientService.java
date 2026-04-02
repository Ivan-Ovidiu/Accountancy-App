package com.Accountancy.app.services;

import com.Accountancy.app.dto.ClientDTO.ClientRequest;
import com.Accountancy.app.dto.ClientDTO.ClientResponse;
import com.Accountancy.app.entities.Client;
import com.Accountancy.app.repositories.ClientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    // GET all active clients
    public List<ClientResponse> getAllClients() {
        return clientRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET single client by id
    public ClientResponse getClientById(Integer id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found: " + id));
        return toResponse(client);
    }

    // POST — create new client
    public ClientResponse createClient(ClientRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new RuntimeException("Client name is required");
        }

        Client client = Client.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .taxId(request.taxId())
                .isActive(true)
                .build();

        return toResponse(clientRepository.save(client));
    }

    // PUT — update existing client
    public ClientResponse updateClient(Integer id, ClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found: " + id));

        client.setName(request.name());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setAddress(request.address());
        client.setTaxId(request.taxId());

        return toResponse(clientRepository.save(client));
    }

    // DELETE — soft delete (sets is_active = false, never deletes from DB)
    public void deactivateClient(Integer id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found: " + id));
        client.setIsActive(false);
        clientRepository.save(client);
    }

    // Search clients by name
    public List<ClientResponse> searchClients(String name) {
        return clientRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Converts Entity → DTO (never expose the entity directly to the controller)
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