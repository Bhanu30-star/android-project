<?php
include("../../connect.php");
$response = array();
if(isset($_POST['transaction_id']) && isset($_POST['bill_party_id']) && isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$bill_invoice_id = $_POST['transaction_id'];
	$partyid = $_POST['bill_party_id'];
	$supplyType_ = $_POST['supplyType'];
	if($supplyType_=='1'){
		$supplyType='O';
	}
	else{

		$supplyType='I';
	}
	$subSupplyType = $_POST['subSupplyType'];  
	$supply_desc = $_POST['supply_desc'];  
	$document_type=$_POST['doctype'];
	$document_no = $_POST['document_no']; 
	$document_date = $_POST['document_date'];
	$seller_gstin = $_POST['dis_gstin'];	
	$seller_trade=$_POST['seller_trade'];
	$from_addr1 = $_POST['from_addr1'];
	$from_addr2=$_POST['from_addr2'];
	$seller_location=$_POST['seller_location'];
	$seller_pin = trim($_POST['seller_pin']); 
	$getfrom_statecode=$_POST['getfrom_statecode'];
	$seller_statecode=$_POST['seller_statecode'];
	$buyer_gstin = trim($_POST['buyer_gstin']); 
	$buyer_trade=$_POST['buyer_trade'];
	$buyer_address1=trim($_POST['buyer_address1']);
	$buyer_address2 = $_POST['buyer_address2']; 
	$buyer_location=$_POST['buyer_location'];
	$buyer_pin=$_POST['buyer_pin'];
	$buyer_statecode=trim($_POST['buyer_statecode']);
	$buyer_phone=$_POST['buyer_phone'];
	$txnType=$_POST['txnType'];
	$dispatch_fromgstin=trim($_POST['dispatch_fromgstin']);
	$dispatch_fromtname=$_POST['dispatch_fromtname'];
	$ship_togstin=$_POST['ship_togstin'];
	$ship_totname=$_POST['ship_totname'];
	$transporter_id=trim($_POST['transporter_id']);
	$transporter_name=$_POST['transporter_name'];
	$transDocNo_1=$_POST['transDocNo_1'];
	$transMode=$_POST['transMode'];
	$transDistance=$_POST['transDistance'];
	$transDocDate_1=$_POST['transDocDate_1'];
	$vehicleType_1=$_POST['vehicleType_1'];
	$vehicleNo_1=$_POST['vehicleNo_1'];
	
	$total_value=$_POST['total_value'];
	$cgst_value=$_POST['cgst_value'];
	$sgst_value=$_POST['sgst_value'];
	$igst_value=$_POST['igst_value'];
	if($igst_value==""){
		$igst_value=0;
	}
	$cess_value=$_POST['cess_value'];
	$cess_non_advalue=$_POST['cess_non_advalue'];
	$other_value=$_POST['other_value'];
	$tot_invoice_value=$_POST['tot_invoice_value'];
	
	$toder = $_POST['total_order'];
	
	$req_status = 'Pending';
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	$msg_insert_check=0;

	//updt party
	$prty_updt=mysqli_query($con,"UPDATE tbl_party SET location='$buyer_location',gstin_no='$buyer_gstin',party_code='$buyer_statecode',party_pincode='$buyer_pin',party_address='$buyer_address2',verified='Yes',trade_name='$buyer_trade',party_ship_address='$buyer_address1' WHERE party_id='$partyid' and verified='No'");
	
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
		$response['success']='0';
		$response['details']="Bill Detail Not Correct. Please check GST Calculation and try again later!!";
	}
	else
	{
		$select_message=mysqli_query($con,"select * from `tbl_party_eway` where invoice_id='$bill_invoice_id' and distributor_id='$session_dist_ver'");
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
			$res=mysqli_query($con,"INSERT INTO `tbl_party_eway`(`distributor_id`,`invoice_id`,`supplyType`,`subSupplyType`,`subSupplyDesc`,`document_type`, `document_no`,`document_date`,`seller_gstin`,`seller_trade`,`seller_address1`,`seller_address2`,`seller_place`,`seller_pin`,`seller_statecode`, `buyer_gstin`, `buyer_trade`, `buyer_address1`, `buyer_address2`,`buyer_place`,`buyer_pin`,`buyer_statecode`,`transactionType`, `dispatch_fromGSTIN`, `dispatch_fromTrade`,`ship_toGSTIN`,`ship_toTrade`,`doc_total_value`,`doc_cgst_amt`,`doc_sgst_amt`,`doc_igst_amt`,`doc_cess_amt`, `doc_nonadvol_amt`, `doc_other_charges`, `total_inv_vaue`, `transporter_id`, `transporterName`, `transDocNo`, `transMode`, `transDistance`, `transDocDate`, `vehicleNo`, `vehicleType`, `status`, `insert_date`, `insert_time`, `insert_from_data`) VALUES ('$session_dist_ver','$bill_invoice_id','$supplyType','$subSupplyType','$supply_desc','$document_type','$document_no','$document_date','$seller_gstin','$seller_trade','$from_addr1','$from_addr2','$seller_location','$seller_pin','$seller_statecode','$buyer_gstin','$buyer_trade','$buyer_address1','$buyer_address2','$buyer_location','$buyer_pin','$buyer_statecode','$txnType','$dispatch_fromgstin','$dispatch_fromtname','$ship_togstin','$ship_totname','$total_value','$cgst_value','$sgst_value','$igst_value','$cess_value','$cess_non_advalue','$other_value','$tot_invoice_value','$transporter_id','$transporter_name','$transDocNo_1','$transMode','$transDistance','$transDocDate_1','$vehicleNo_1','$vehicleType_1','$req_status','$da','$scro','Web')");
			$re = mysqli_insert_id($con);
			if($re>0)
			{
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$prodid=$person_a['product_id'];
					$prodname=$person_a['product_name'];
					$ordquantiy=$person_a['quantity'];
					$proprice=$person_a['eprice'];
					$cgstamt=$person_a['ecgst'];
					$sgstamt=$person_a['esgst'];
					$igstamt=$person_a['eigst'];
					$pro_discount=$person_a['edisc'];
					$hsn_code = $person_a['hsn_code'];
					$pro_gst_perc = $person_a['gst_perc'];
					$pro_total=$person_a['etotal'];
					$assess_amount=$person_a['eassess'];
					$net_amount=$person_a['eitemtotal'];
					$barcode = $person_a['IMEI_NO'];
					$cess_perc = $person_a['cess_percentage'];
					$cess_amt = $person_a['ecess'];
					$prounit=$person_a['unit'];
					$query2=mysqli_query($con,"INSERT INTO `tbl_party_eway_detail`(`transaction_id`, `product_id`, `product_name`, `hsn_code`, `product_price`, `quantity`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `gst_perc`, `cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `product_total_amt`, `IMEI_NO`, `assess_amount`, `net_amount`,`unit`) VALUES ('$re','$prodid','$prodname','$hsn_code','$proprice','$ordquantiy','$pro_discount','$cgstamt','$sgstamt','$igstamt','$pro_gst_perc','0','$cess_perc','$cess_amt','$pro_total','$barcode','$assess_amount','$net_amount','$prounit')");
				}
				$response['success']='1';
				$response['details']="E-Way Detail Successfully Inserted...!!";
			}
			else
			{
				$response['success']='0';
				$response['details']="Insertion Error...!!";
			}
		}
		else
		{
			$response['success']='0';
			$response['details']="E-Way Already Generated...!!";
		}
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>