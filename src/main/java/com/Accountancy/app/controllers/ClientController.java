package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.ClientDTO.ClientRequest;
import com.Accountancy.app.dto.ClientDTO.ClientResponse;
import com.Accountancy.app.services.ClientService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // GET /api/clients
    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    // GET /api/clients/search?name=Firma
    @GetMapping("/search")
    public ResponseEntity<List<ClientResponse>> searchClients(@RequestParam String name) {
        return ResponseEntity.ok(clientService.searchClients(name));
    }

    // GET /api/clients/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    // POST /api/clients
    @PostMapping
    public ResponseEntity<ClientResponse> createClient(@RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.createClient(request));
    }

    // PUT /api/clients/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> updateClient(@PathVariable Integer id,
                                                       @RequestBody ClientRequest request) {
        return ResponseEntity.ok(clientService.updateClient(id, request));
    }

    // DELETE /api/clients/{id}  — soft delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateClient(@PathVariable Integer id) {
        clientService.deactivateClient(id);
        return ResponseEntity.noContent().build();
    }
}