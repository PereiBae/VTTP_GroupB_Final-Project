package vttp.batch5.paf.finalproject.server.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vttp.batch5.paf.finalproject.server.repositories.mysql.MyUserDetailsRepository;

@Service
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private MyUserDetailsRepository myUserDetailsRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException{
        return myUserDetailsRepo.loadUserByUsername(username);
    }

    public boolean registerUser(String email, String encodedPassword) {
        return myUserDetailsRepo.createUser(email, encodedPassword);
    }

}
