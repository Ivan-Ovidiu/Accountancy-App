package com.Accountancy.app.repositories;

import com.Accountancy.app.entities.UserCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCompanyRepository extends JpaRepository<UserCompany, Integer> {

    /** Companies the user has access to, sorted by company code. */
    @Query("""
           SELECT uc FROM UserCompany uc
           WHERE uc.userId = :userId AND uc.company.isActive = true
           ORDER BY uc.company.code ASC
           """)
    List<UserCompany> findAccessibleByUserId(@Param("userId") Integer userId);

    /** True if the user can operate on this company. Use in security checks. */
    boolean existsByUserIdAndCompany_Id(Integer userId, Integer companyId);

    Optional<UserCompany> findByUserIdAndCompany_Id(Integer userId, Integer companyId);

    /** The user's preselected company, if any. */
    Optional<UserCompany> findFirstByUserIdAndIsDefaultTrue(Integer userId);

    List<UserCompany> findByUserId(Integer userId);

    List<UserCompany> findByCompany_Id(Integer companyId);

    void deleteByUserIdAndCompany_Id(Integer userId, Integer companyId);
    @Modifying
    @Query("DELETE FROM UserCompany uc WHERE uc.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Integer companyId);
}