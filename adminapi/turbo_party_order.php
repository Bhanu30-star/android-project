<?php
$response = array();
include("../../connect.php");
if(isset($_POST['invoice_id']) && isset($_POST['distributor_id']))
{  
	$tid = $_POST['invoice_id']; 	
	$ver = $_POST['distributor_id'];
	$cdate11  = date("m");
	$cdate12  = date("Y");
	if($cdate11=="01")
	{
		$cdate12=$cdate12-1;
		$cdate11='12';
	}
	else
	{
		$cdate11=$cdate11-1;
	}
	if(strlen($cdate11)==1)
		$cdate11="0".$cdate11;
	$cdate1 = $cdate12."-".$cdate11."-01";
	$cdate2 = $cdate12."-".$cdate11."-28";
	$cdate2=date("Y-m-t", strtotime($cdate2));
	
	$temp="";
	$select_order=mysqli_query($con,"select max(transaction_bill_number) as bill_txn_id from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_date='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type in ('Tax Invoice','Delivery Challan','Payout')");
	while($select_row =  mysqli_fetch_assoc($select_order))
	{
		$temp=$select_row['bill_txn_id'];
	}
	if($temp!="")
	{			
		$temp_string=$temp[0];
		$temp_explode="";
		$final_invoice=(int)substr($temp,1);
		$final_invoice=$final_invoice+1;
		$final_invoice1=(string)$final_invoice;
		$string_count=5-(int)strlen($final_invoice1);
		for($vb=0;$vb<$string_count;$vb++)
		{
			$temp_explode=$temp_explode."0";
		}
		$sd=$temp_string.$temp_explode.$final_invoice;
		$temp=$sd;
	}
	else
	{
		$temp_date2=strtotime($cdate1);
		$month_arr=array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
		$month_arr_temp=array("J","K","L","A","B","C","D","E","F","G","H","I");
		$curre_month=date("M",$temp_date2);
		for($gh=0;$gh<count($month_arr);$gh++)
		{
			if($month_arr[$gh]==$curre_month)
			{
				$temp_string=$month_arr_temp[$gh];
			}
		}
		$sd=$temp_string."00001";
		$temp=$sd;
	}		

	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
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
	$res = mysqli_query($con,"select * from  tbl_digitally_invoice,tbl_distributor where tbl_digitally_invoice.AR_Code=tbl_distributor.oid and tbl_distributor.distributor_id='$ver' and invoice_id='$tid'");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$retailer_name_val=$retailer_name;
		$proname=$product_name;
		$result = mysqli_query($con, "select tbl_party_user.party_id,tbl_party_user.user_id,tbl_party.gstin_no from tbl_party,tbl_party_user where tbl_party.party_id=tbl_party_user.party_id and tbl_party.distributor_id='$ver' and tbl_party.party_name='$retailer_name_val' and tbl_party.gstin_no in('08AAACH1766P1Z5','08AAICA4398J1Z6','08AADCB0147R1ZF') and tbl_party.status='Active'");
		while($row_party = mysqli_fetch_array($result)){
			$pp_id1=$row_party['party_id'];
			$uu_id1=$row_party['user_id'];
			$party_gstinno=$row_party['gstin_no'];
		}
		
		if($pp_id1>0)
		{
			$net_total_Amt=$Commission+$Total_CGST+$Total_SGST+$Total_IGST;
			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
			$query ="insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_to,transaction_from,total_amount,payment_status,bill_type,final_amt,bill_date,round_off_amt,payment_mode,generated_by,txn_id,party_gstin,gst_configure)values('$transaction_id','$cdate2','$scro','$sd','$pp_id1','$uu_id1','$net_total_Amt','Complete','Tax Invoice','$Grand_Total','$Invoice_acceptance_date_by_Partner','$Round_Off','NEFT','Distributor','$Payout_Transaction_Reference_No','$party_gstinno','Inclusive')";
			$res_insert = mysqli_query($con,$query);
			if($res_insert)
			{
				$res1 = mysqli_query($con,"SELECT transaction_id FROM  tbl_party_transaction where transaction_to='$pp_id1' and transaction_from='$uu_id1' and bill_type='Tax Invoice' and txn_id='$Payout_Transaction_Reference_No' ORDER BY `id` DESC LIMIT 1");
				$row =  mysqli_fetch_assoc($res1);
				if(mysqli_num_rows($res1)>0)
				{		
					$re= $row['transaction_id'];
					$res12 = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_category='BRANDING' and product_name like '%$proname%'");
					while($fetch_product11=mysqli_fetch_assoc($res12))
					{
						$proid=$fetch_product11['product_id'];
						$prodname=$fetch_product11['product_name'];
						$proprice=$fetch_product11['product_price'];
						$prohsn=$fetch_product11['hsn_code'];
						$gst_perc=$fetch_product11['CGST']+$fetch_product11['SGST'];
						$pur_total_amt =round($Grand_Total,2);
						$pur_taxable_amt = round($Grand_Total-$Total_CGST-$Total_SGST-$Total_IGST,2);
						
						$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount,IGST_amount,product_price,gst_perc,product_total_amt,taxable_amount)values('$re','$proid','$prodname','$Grand_Total','$Total_CGST','$Total_SGST','$Total_IGST','$proprice','$gst_perc','$pur_total_amt','$pur_taxable_amt')");
						
						$query_gst=mysqli_query($con,"INSERT INTO `gst_reports_jan2018`(`distributor_id`, `hsn_code`, `gstin_no`, `transaction_to`, `bill_type`, `total_sale`, `total_cgst_amt`, `total_sgst_amt`,`total_igst_amt`, `transaction_bill_number`, `party_name`, `transaction_date`, `transaction_time`) VALUES ('$ver','$prohsn','$party_gstinno','$pp_id1','Tax Invoice','$Grand_Total','$Total_CGST','$Total_SGST','$Total_IGST','$sd','$retailer_name_val','$cdate2','$scro')");
					}
				}
			}
			$uq=mysqli_query($con,"UPDATE tbl_digitally_invoice SET Invoice_CN_status_by_Partner='Accepted',accept_datetime='$scri',company_status='Accepted' where invoice_id='$tid'");
		}
	}
	if($query2)
	{
		$response['success']=1;
		$response['details']="Turbo Invoice Successfully Generated!";
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
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 