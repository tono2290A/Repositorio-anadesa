using Microsoft.EntityFrameworkCore;
using AnadesaApi.Models;

namespace AnadesaApi.Data;

public class AnadesaDbContext : DbContext
{
    public AnadesaDbContext(DbContextOptions<AnadesaDbContext> options) : base(options) { }

    public DbSet<TipoUsuario> TiposUsuario => Set<TipoUsuario>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Modulo> Modulos => Set<Modulo>();
    public DbSet<Permiso> Permisos => Set<Permiso>();
    public DbSet<RolModulo> RolModulos => Set<RolModulo>();
    public DbSet<RolModuloPermiso> RolModuloPermisos => Set<RolModuloPermiso>();
    public DbSet<Programa> Programas => Set<Programa>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<CategoriaParticipante> CategoriasParticipante => Set<CategoriaParticipante>();
    public DbSet<Comunidad> Comunidades => Set<Comunidad>();
    public DbSet<Participante> Participantes => Set<Participante>();
    public DbSet<FotografiaParticipante> FotografiasParticipante => Set<FotografiaParticipante>();
    public DbSet<ContactoParticipante> ContactosParticipante => Set<ContactoParticipante>();
    public DbSet<Direccion> Direcciones => Set<Direccion>();
    public DbSet<Familiar> Familiares => Set<Familiar>();
    public DbSet<ParticipanteFamiliar> ParticipanteFamiliares => Set<ParticipanteFamiliar>();
    public DbSet<Grupo> Grupos => Set<Grupo>();
    public DbSet<GrupoParticipante> GrupoParticipantes => Set<GrupoParticipante>();
    public DbSet<TipoActividad> TiposActividad => Set<TipoActividad>();
    public DbSet<Actividad> Actividades => Set<Actividad>();
    public DbSet<ProgramacionActividad> ProgramacionActividades => Set<ProgramacionActividad>();
    public DbSet<AsignacionFacilitador> AsignacionFacilitadores => Set<AsignacionFacilitador>();
    public DbSet<Asistencia> Asistencias => Set<Asistencia>();
    public DbSet<Monitoreo> Monitoreos => Set<Monitoreo>();
    public DbSet<ObservacionMonitoreo> ObservacionesMonitoreo => Set<ObservacionMonitoreo>();
    public DbSet<CriterioEvaluacion> CriteriosEvaluacion => Set<CriterioEvaluacion>();
    public DbSet<Evaluacion> Evaluaciones => Set<Evaluacion>();
    public DbSet<ResultadoEvaluacion> ResultadosEvaluacion => Set<ResultadoEvaluacion>();
    public DbSet<CicloEscolar> CiclosEscolares => Set<CicloEscolar>();
    public DbSet<Grado> Grados => Set<Grado>();
    public DbSet<InscripcionAcademica> InscripcionesAcademicas => Set<InscripcionAcademica>();
    public DbSet<BloqueAcademico> BloquesAcademicos => Set<BloqueAcademico>();
    public DbSet<HistorialAcademico> HistorialAcademico => Set<HistorialAcademico>();
    public DbSet<Promedio> Promedios => Set<Promedio>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<RecuperacionContrasena> RecuperacionesContrasena => Set<RecuperacionContrasena>();
    public DbSet<ExpedienteDigital> ExpedientesDigitales => Set<ExpedienteDigital>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UsuarioRol>().HasOne(ur => ur.Usuario).WithMany().HasForeignKey(ur => ur.id_usuario);
        modelBuilder.Entity<UsuarioRol>().HasOne(ur => ur.Rol).WithMany().HasForeignKey(ur => ur.id_rol);
        modelBuilder.Entity<RolModulo>().HasOne(rm => rm.Rol).WithMany().HasForeignKey(rm => rm.id_rol);
        modelBuilder.Entity<RolModulo>().HasOne(rm => rm.Modulo).WithMany().HasForeignKey(rm => rm.id_modulo);
        modelBuilder.Entity<RolModuloPermiso>().HasOne(rmp => rmp.Rol).WithMany().HasForeignKey(rmp => rmp.id_rol);
        modelBuilder.Entity<RolModuloPermiso>().HasOne(rmp => rmp.Modulo).WithMany().HasForeignKey(rmp => rmp.id_modulo);
        modelBuilder.Entity<RolModuloPermiso>().HasOne(rmp => rmp.Permiso).WithMany().HasForeignKey(rmp => rmp.id_permiso);
        modelBuilder.Entity<GrupoParticipante>().HasOne(gp => gp.Grupo).WithMany().HasForeignKey(gp => gp.id_grupo);
        modelBuilder.Entity<GrupoParticipante>().HasOne(gp => gp.Participante).WithMany().HasForeignKey(gp => gp.id_participante);
        modelBuilder.Entity<ParticipanteFamiliar>().HasOne(pf => pf.Participante).WithMany().HasForeignKey(pf => pf.id_participante);
        modelBuilder.Entity<ParticipanteFamiliar>().HasOne(pf => pf.Familiar).WithMany().HasForeignKey(pf => pf.id_familiar);
        modelBuilder.Entity<Permiso>().HasOne(p => p.Modulo).WithMany().HasForeignKey(p => p.id_modulo);
        modelBuilder.Entity<Participante>().HasOne(p => p.Programa).WithMany().HasForeignKey(p => p.id_programa);
        modelBuilder.Entity<Participante>().HasOne(p => p.Categoria).WithMany().HasForeignKey(p => p.id_categoria);
        modelBuilder.Entity<Grupo>().HasOne(g => g.Programa).WithMany().HasForeignKey(g => g.id_programa);
        modelBuilder.Entity<Monitoreo>().HasOne(m => m.Usuario).WithMany().HasForeignKey(m => m.id_usuario);
        modelBuilder.Entity<Monitoreo>().HasOne(m => m.Participante).WithMany().HasForeignKey(m => m.id_participante);
        modelBuilder.Entity<Evaluacion>().HasOne(e => e.Usuario).WithMany().HasForeignKey(e => e.id_usuario);
        modelBuilder.Entity<Evaluacion>().HasOne(e => e.Participante).WithMany().HasForeignKey(e => e.id_participante);
        modelBuilder.Entity<Notificacion>().HasOne(n => n.Usuario).WithMany().HasForeignKey(n => n.id_usuario);
    }
}
