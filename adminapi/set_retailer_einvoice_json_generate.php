<?php
$response = array();
include("../../connect.php");
if(isset($_POST['transaction_id']) && isset($_POST['transactionto']) && isset($_POST['Version']) && isset($_POST['tax_type']) && isset($_POST['transaction_category']) && isset($_POST['igst_intra']) && isset($_POST['doc_type']) && isset($_POST['document_no']) && isset($_POST['document_date']) && isset($_POST['seller_gstin']) && isset($_POST['distributor_id']))
{  
	$flag_check=0;
	$bill_invoice_id = $_POST['transaction_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$query_check_1 = mysqli_query($con,"select * from tbl_party_einvoice_generation_process where transaction_id='$bill_invoice_id' and status in ('In Process','Hold')");
	if(mysqli_num_rows($query_check_1)>0)
	{ 
		$flag_check=1;
		$response['success']=0;
		$response['details']="E-Invoice JSON already uploaded for Process...!!";
	}
	
	$query_check_2=mysqli_query($con,"select * from `tbl_party_einvoice` where invoice_id='$bill_invoice_id' and distributor_id='$session_dist_ver' and status in ('Pending','Complete','Hold')");
	if(mysqli_num_rows($query_check_2)>0)
	{
		$flag_check=1;
		$response['success']=0;
		$response['details']="E-Invoice JSON already uploaded for Process...!!";
	}
	

	if($flag_check==0) {
	$partyid = $_POST['transactionto'];
	$version = $_POST['Version'];  
	$taxsch = $_POST['tax_type'];  
	$transaction_category = $_POST['transaction_category']; 
	$igst_intra = $_POST['igst_intra'];
	$ecommerce_gstin = $_POST['ecommerce_gstin'];	
	$reverse_charges=isset($_POST['reverse_charges']) ? $_POST['reverse_charges'] : 'N';
	$document_type = $_POST['doc_type']; 
	$document_no_=$_POST['document_no'];
	$document_no=trim($document_no_);
	$document_date=$_POST['document_date'];
	$seller_gstin = trim($_POST['seller_gstin']); 
	$seller_legal_name=$_POST['seller_legal_name'];
	$seller_trade=$_POST['seller_trade'];
	$seller_phone = trim($_POST['seller_phone']); 
	$seller_location=$_POST['seller_location'];
	$seller_pin=trim($_POST['seller_pin']);
	$seller_statecode = $_POST['seller_statecode']; 
	$seller_email=$_POST['seller_email'];
	$seller_address1=$_POST['seller_address1'];
	$seller_address2 = $_POST['seller_address2']; 
	$buyer_gstin=trim($_POST['buyer_gstin']);
	$buyer_legalname=mysqli_real_escape_string($con,$_POST['buyer_legalname']);
	$buyer_trade=mysqli_real_escape_string($con,$_POST['buyer_trade']);
	$buyer_pin=trim($_POST['buyer_pin']);
	$buyer_place_supply=$_POST['buyer_place_supply'];
	$buyer_location=$_POST['buyer_location'];
	$buyer_statecode=$_POST['buyer_statecode'];
	$buyer_phone=trim($_POST['buyer_phone']);
	$buyer_address1=$_POST['buyer_address1'];
	$buyer_address2=$_POST['buyer_address2'];
	$doc_assess_amount=$_POST['doc_assess_amount'];
	$doc_item_amount=$_POST['doc_item_amount'];
	
	$doc_cgst_amt=$_POST['doc_cgst_amt'];
	$doc_sgst_amt=$_POST['doc_sgst_amt'];
	$doc_igst_amt=$_POST['doc_igst_amt'];
	$doc_cess_amt=$_POST['doc_cess_amt'];
	$doc_discount_amt=$_POST['doc_discount_amt'];
	$doc_other_amount=$_POST['doc_other_amount'];
	$buyer_legal_api_hit=$_POST['buyer_legal_api_hit'];
	$req_status = 'Pending';
	$toder = $_POST['total_order'];
	
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	$msg_insert_check=0;
	
	
	if($buyer_gstin!='' && $buyer_legalname!='' && $buyer_legal_api_hit==1)
	{
		//updt party
		$prty_updt=mysqli_query($con,"UPDATE tbl_party SET legal_name='$buyer_legalname',location='$buyer_location',gstin_no='$buyer_gstin',party_code='$buyer_statecode',party_pincode='$buyer_pin',party_address='$buyer_address1',verified='Yes',trade_name='$buyer_trade' WHERE party_id='$partyid' and verified='No'");
	}
	
	$show_flag=0;
	if($seller_statecode=='' || $buyer_statecode=='')
	{ 
		$show_flag=0; 
	} 
	else
	{ 
		if($buyer_statecode==$seller_statecode)
			$show_flag=0;
		else
			$show_flag=1;
	} 

	
	if(($show_flag==0 && $doc_igst_amt>0) || ($show_flag==1 && $doc_cgst_amt>0))
	{
		$response['success']=0;
		$response['details']="Bill Detail Not Correct. Please check GST Calculation and try again later!!";
	}
	else if($seller_gstin==$buyer_gstin)
	{
		$response['success']=0;
		$response['details']="Supplier and recipient GSTIN should not be the same.!!";
	}
	else
	{
		$select_message=mysqli_query($con,"select * from `tbl_party_einvoice` where invoice_id='$bill_invoice_id' and distributor_id='$session_dist_ver'");
		if(mysqli_num_rows($select_message)>0)
		{
			while($check_txn=mysqli_fetch_assoc($select_message))
			{ 
				if($check_txn['status']=="Pending" || ($check_txn['Irn']!='' && $check_txn['status']=="Deleted"))
					$msg_insert_check=1;
			}
		}
		
		if($msg_insert_check==0 && $buyer_gstin!='' && $req_status!='')
		{
			$res = mysqli_query($con,"INSERT INTO `tbl_party_einvoice`(`distributor_id`, `invoice_id`, `version`, `taxsch`, `transaction_category`, `reverse_charges`, `ecommerce_gstin`, `igst_intra`, `document_type`, `document_no`, `document_date`, `seller_gstin`, `seller_legal_name`, `seller_trade`, `seller_phone`, `seller_location`, `seller_pin`, `seller_statecode`, `seller_email`, `seller_address1`, `seller_address2`, `buyer_gstin`, `buyer_legalname`, `buyer_trade`, `buyer_pin`, `buyer_place_supply`, `buyer_location`, `buyer_statecode`, `buyer_phone`, `buyer_address1`, `buyer_address2`, `doc_assess_amount`, `doc_item_amount`, `status`, `insert_date`, `insert_time`, `doc_cgst_amt`, `doc_sgst_amt`, `doc_igst_amt`, `doc_cess_amt`, `doc_discount_amt`, `insert_from_data`,`doc_other_charges`) VALUES ('$session_dist_ver','$bill_invoice_id','$version','$taxsch','$transaction_category','$reverse_charges','$ecommerce_gstin','$igst_intra','$document_type','$document_no','$document_date','$seller_gstin','$seller_legal_name','$seller_trade','$seller_phone','$seller_location','$seller_pin','$seller_statecode','$seller_email','$seller_address1','$seller_address2','$buyer_gstin','$buyer_legalname','$buyer_trade','$buyer_pin','$buyer_place_supply','$buyer_location','$buyer_statecode','$buyer_phone','$buyer_address1','$buyer_address2','$doc_assess_amount','$doc_item_amount','$req_status','$da','$scro','$doc_cgst_amt','$doc_sgst_amt','$doc_igst_amt','$doc_cess_amt','$doc_discount_amt','Application','$doc_other_amount')");
			$re = mysqli_insert_id($con);
			if($re>0)
			{
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$prodid=$person_a['product_id'];
					$prodname=$person_a['product_name'];
					$ordquantiy=$person_a['quantity'];
					$proprice=$person_a['pro_price'];
					$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
					$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
					$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
					$pro_discount = isset($person_a['pro_discount']) ? $person_a['pro_discount'] : '';
					$hsn_code = $person_a['hsn_code'];
					$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
					$pro_total = isset($person_a['pro_total']) ? $person_a['pro_total'] : '0';
					$assess_amount = isset($person_a['assess_amount']) ? $person_a['assess_amount'] : '0';
					$net_amount = isset($person_a['net_amount']) ? $person_a['net_amount'] : '0';
					$barcode = $person_a['barcode'];
					$cess_perc = $person_a['cess_perc'];
					$cess_amt =  $person_a['cess_amt'];
					$query2=mysqli_query($con,"INSERT INTO `tbl_party_einvoice_detail`(`transaction_id`, `product_id`, `product_name`, `hsn_code`, `product_price`, `quantity`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `gst_perc`, `product_total_amt`, `assess_amount`,`net_amount`,`IMEI_NO`, `cess_percentage`,`cess_final_amt`) VALUES ('$re','$prodid','$prodname','$hsn_code','$proprice','$ordquantiy','$pro_discount','$cgstamt','$sgstamt','$igstamt','$pro_gst_perc','$pro_total','$assess_amount','$net_amount','$barcode','$cess_perc','$cess_amt')");
				}
				$prty_error_delete=mysqli_query($con,"update tbl_party_einvoice_error set status='Clear' WHERE distributor_id='$session_dist_ver' and transaction_id='$bill_invoice_id'");
				$response['success']=1;
				$response['details']="E-Invoice Detail Successfully Inserted...!!";
			}
			else
			{
				$response['success']=0;
				$response['details']="Insertion Error...!!";
			}
		}
		else
		{
			$response['success']=0;
			$response['details']="E-Invoice Already Generated...!!";
		}
	}}
	else
	{
		$response['success']=0;
		$response['details']="E-Invoice Already Generated...!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 