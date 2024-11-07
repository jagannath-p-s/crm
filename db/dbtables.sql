-- users table


create table
  public.users (
    id serial not null,
    username character varying(50) not null,
    useremail character varying(100) not null,
    password character varying(255) not null,
    role character varying(50) not null,
    datetime timestamp without time zone null default current_timestamp,
    mobile_number character varying(50) null,
    can_edit_staff boolean null default false,
    can_edit_pipeline boolean null default false,
    can_edit_product boolean null default false,
    can_edit_files boolean null default false,
    can_edit_enquiries boolean null default false,
    can_edit_stock boolean null default false,
    can_edit_product_enquiry boolean null default false,
    can_edit_service_enquiry boolean null default false,
    can_edit_sales boolean null default false,
    can_see_performance boolean null default false,
    employee_code text null,
    can_view_staff boolean null default false,
    can_view_pipeline boolean null default false,
    can_view_product boolean null default false,
    can_view_files boolean null default false,
    can_view_enquiries boolean null default false,
    can_view_stock boolean null default false,
    can_view_product_enquiry boolean null default false,
    can_view_service_enquiry boolean null default false,
    can_view_sales boolean null default false,
    constraint users_pkey primary key (id),
    constraint users_useremail_key unique (useremail),
    constraint role_check check (
      (
        (role)::text = any (
          array[
            ('Admin'::character varying)::text,
            ('Manager'::character varying)::text,
            ('Salesperson'::character varying)::text,
            ('Service'::character varying)::text,
            ('Accounts'::character varying)::text
          ]
        )
      )
    )
  ) tablespace pg_default;


-- uploaded files 


  create table
  public.uploaded_files (
    file_id serial not null,
    file_name character varying(255) not null,
    file_path character varying(255) not null,
    uploaded_by integer not null,
    upload_date timestamp without time zone null default current_timestamp,
    admin_access boolean null default false,
    manager_access boolean null default false,
    salesperson_access boolean null default false,
    service_access boolean null default false,
    accounts_access boolean null default false,
    file_size integer null,
    file_type character varying(50) null,
    constraint uploaded_files_pkey primary key (file_id),
    constraint uploaded_files_uploaded_by_fkey foreign key (uploaded_by) references users (id)
  ) tablespace pg_default;


create view
  public.uploaded_files_view as
select
  uf.file_id,
  uf.file_name,
  uf.file_path,
  uf.uploaded_by,
  uf.upload_date,
  uf.admin_access,
  uf.manager_access,
  uf.salesperson_access,
  uf.service_access,
  uf.accounts_access,
  u.username as uploaded_by_username,
  u.useremail as uploaded_by_email
from
  uploaded_files uf
  join users u on uf.uploaded_by = u.id;

-- cateogries subcateogries products and batches 

create table
  public.categories (
    category_id serial not null,
    category_name character varying(255) not null,
    constraint categories_pkey primary key (category_id)
  ) tablespace pg_default;

  create table
  public.subcategories (
    subcategory_id serial not null,
    subcategory_name character varying(255) not null,
    category_id integer null,
    constraint subcategories_pkey primary key (subcategory_id),
    constraint subcategories_category_id_fkey foreign key (category_id) references categories (category_id)
  ) tablespace pg_default;

  create table
  public.products (
    product_id serial not null,
    barcode_number character varying(100) null,
    item_alias character varying(255) null,
    model_number character varying(100) null,
    item_name character varying(255) null,
    category_id integer null,
    subcategory_id integer null,
    price numeric(10, 2) null,
    min_stock integer null,
    current_stock integer null default 0,
    image_link text null,
    slno serial not null,
    company_name character varying(255) null,
    uom character varying(50) null,
    constraint products_pkey primary key (product_id),
    constraint products_barcode_number_unique unique (barcode_number),
    constraint fk_subcategory foreign key (subcategory_id) references subcategories (subcategory_id),
    constraint products_category_id_fkey foreign key (category_id) references categories (category_id)
  ) tablespace pg_default;

  create table
  public.batches (
    batch_id serial not null,
    barcode_number text not null,
    batch_code character varying(50) not null,
    expiry_date date null,
    current_stock integer not null,
    store text null,
    rack_number text null,
    box_number text null,
    constraint batches_pkey primary key (batch_id),
    constraint batches_barcode_batch_code_key unique (barcode_number, batch_code),
    constraint batches_barcode_fkey foreign key (barcode_number) references products (barcode_number)
  ) tablespace pg_default;

-- lead sources 

create table
  public.lead_sources (
    id serial not null,
    lead_source character varying(255) not null,
    district character varying(255) null,
    state character varying(255) null,
    created_at timestamp without time zone null default now(),
    constraint lead_sources_pkey primary key (id)
  ) tablespace pg_default;

create index if not exists idx_lead_sources_district on public.lead_sources using btree (district) tablespace pg_default;

create index if not exists idx_lead_sources_lead_source on public.lead_sources using btree (lead_source) tablespace pg_default;

create index if not exists idx_lead_sources_state on public.lead_sources using btree (state) tablespace pg_default;


-- enquiries 


create table
  public.enquiries (
    id uuid not null default extensions.uuid_generate_v4 (),
    name text not null,
    mobilenumber1 text not null,
    mobilenumber2 text null,
    address text null,
    location text null,
    stage text not null,
    dbt_userid_password text null,
    leadsource text null,
    assignedto integer null,
    remarks text null,
    invoiced boolean not null default false,
    collected boolean not null default false,
    products jsonb null,
    created_at timestamp with time zone null default now(),
    salesflow_code text null,
    won_date timestamp with time zone null,
    pipeline_id integer null,
    current_stage_id integer null,
    last_updated timestamp with time zone null default now(),
    state character varying(255) null,
    district character varying(255) null,
    expected_completion_date timestamp with time zone null,
    subsidy boolean not null default false,
    dbt_c_o text null,
    contacttype text null,
    constraint enquiries_pkey primary key (id),
    constraint enquiries_pipeline_id_fkey foreign key (pipeline_id) references pipelines (pipeline_id)
  ) tablespace pg_default;

create trigger set_last_updated before
update on enquiries for each row
execute function update_last_updated_column ();

-- pipeline , pieline stages and pipeline fileds 

create table
  public.pipelines (
    pipeline_id serial not null,
    pipeline_name character varying(255) not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint pipelines_pkey primary key (pipeline_id)
  ) tablespace pg_default;

  create table
  public.pipeline_stages (
    stage_id serial not null,
    pipeline_id integer null,
    stage_name character varying(255) not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint pipeline_stages_pkey primary key (stage_id),
    constraint pipeline_stages_pipeline_id_fkey foreign key (pipeline_id) references pipelines (pipeline_id)
  ) tablespace pg_default;

  create table
  public.pipeline_fields (
    field_id serial not null,
    stage_id integer null,
    field_name character varying(255) not null,
    field_type character varying(50) not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint pipeline_fields_pkey primary key (field_id),
    constraint pipeline_fields_stage_id_fkey foreign key (stage_id) references pipeline_stages (stage_id),
    constraint pipeline_fields_field_type_check check (
      (
        (field_type)::text = any (
          array[
            ('checkbox'::character varying)::text,
            ('textfield'::character varying)::text,
            ('file'::character varying)::text,
            ('date'::character varying)::text
          ]
        )
      )
    )
  ) tablespace pg_default;

  create table
  public.pipeline_data_json (
    enquiry_id uuid not null,
    pipeline_id integer not null,
    stage_id integer not null,
    data jsonb not null,
    constraint pipeline_data_json_pkey primary key (enquiry_id, pipeline_id, stage_id),
    constraint pipeline_data_json_enquiry_id_fkey foreign key (enquiry_id) references enquiries (id),
    constraint pipeline_data_json_pipeline_id_fkey foreign key (pipeline_id) references pipelines (pipeline_id),
    constraint pipeline_data_json_stage_id_fkey foreign key (stage_id) references pipeline_stages (stage_id)
  ) tablespace pg_default;


-- bills and bill items 

create table
  public.bill_items (
    bill_item_id serial not null,
    bill_id integer not null,
    product_id integer null,
    product_name character varying(255) null,
    quantity integer null,
    price numeric(10, 2) null,
    amount numeric(10, 2) null,
    batch_code character varying(50) null,
    constraint bill_items_pkey primary key (bill_item_id),
    constraint bill_items_bill_id_fkey foreign key (bill_id) references bills (bill_id) on delete cascade,
    constraint bill_items_product_id_fkey foreign key (product_id) references products (product_id)
  ) tablespace pg_default;


  create table
  public.bills (
    bill_id serial not null,
    customer_name character varying(255) null,
    job_card_number character varying(255) null,
    waiting_number character varying(255) null,
    pipeline_name character varying(255) null,
    total_amount numeric(10, 2) not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint bills_pkey primary key (bill_id)
  ) tablespace pg_default;

create table
  public.technicians (
    id serial not null,
    name character varying(255) not null,
    employee_code character varying(50) not null,
    constraint technicians_pkey primary key (id)
  ) tablespace pg_default;


-- technician and technician changes 


create table
  public.technician_changes (
    id serial not null,
    service_id integer not null,
    changes jsonb not null,
    created_at timestamp without time zone null default now(),
    constraint technician_changes_pkey primary key (id),
    constraint technician_changes_service_id_fkey foreign key (service_id) references service_enquiries (id)
  ) tablespace pg_default;


-- tasks


create table
  public.tasks (
    id uuid not null default extensions.uuid_generate_v4 (),
    task_name text not null,
    task_message text not null,
    enquiry_id uuid null,
    type text not null,
    submission_date timestamp with time zone not null default (now() + '1 day'::interval),
    assigned_by integer not null,
    assigned_to integer not null,
    completion_status text not null default 'new'::text,
    constraint tasks_pkey primary key (id),
    constraint tasks_enquiry_id_fkey foreign key (enquiry_id) references enquiries (id),
    constraint tasks_completion_status_check check (
      (
        completion_status = any (
          array[
            'new'::text,
            'ongoing'::text,
            'completed'::text,
            'overdue'::text
          ]
        )
      )
    ),
    constraint tasks_type_check check (
      (
        type = any (array['service'::text, 'product'::text])
      )
    )
  ) tablespace pg_default;


-- previous users details 


  create table
  public.user_details (
    id serial not null,
    title character varying(200) null,
    stage character varying(200) null,
    first_name character varying(150) not null,
    second_name character varying(150) not null,
    contact_number character varying(20) not null,
    alternate_contact_number character varying(20) null,
    user_id character varying(150) not null,
    password text not null,
    description text null,
    created_at timestamp without time zone null default now(),
    updated_at timestamp without time zone null default now(),
    constraint user_details_pkey primary key (id)
  ) tablespace pg_default;

create trigger update_user_details_timestamp before
update on user_details for each row
execute function update_timestamp ();


