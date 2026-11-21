<?php
include("../../connect.php");
$response = array();
if(isset($_POST['search_year']) && isset($_POST['distributor_id']))
{
	$search_year=$_POST['search_year'];
	$distid=$_POST['distributor_id'];
	$response['freeze_status']='No';
	$check_dist_gstr = mysqli_query($con,"select * from tbl_distributor_financialyear_report where distributor_id='$distid' and financial_year='$search_year'");
	while($fetch_product=mysqli_fetch_assoc($check_dist_gstr))
	{
		$mail_count_val=$fetch_product['mail_count'];	
		if($mail_count_val==3)
			$response['freeze_status']='Yes';
	}
	$flagfinal=0;
	$query1 = mysqli_query($con,"select *  from tbl_distributor_financial_report where distributor_id='$distid' and status='Accept' and financial_year like '%$search_year%'");
	$itrbook=array();
	if(mysqli_num_rows($query1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query1))
		{
			$flagfinal=1;
			$itrbook['report_id']=$fetch_product['report_id'];
			$itrbook['report_type']=$fetch_product['report_type'];
			$itrbook['report_url']="financial_itr_report/".$fetch_product['report_url'];
			$itrbook['financial_year']=$fetch_product['financial_year'];
			$response['itrbook'][]=$itrbook;
		}
	}
	else
	{
		$response['itrbook']=$itrbook;
	}

	$query2 = mysqli_query($con,"select *  from tbl_distributor_gstr_financial_report where distributor_id='$distid' and status='Accept' and financial_year='$search_year'");
	$gstbook=array();
	if(mysqli_num_rows($query2)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query2))
		{
			$flagfinal=1;
			$gstbook['report_id']=$fetch_product['report_id'];
			$gstbook['report_type']=$fetch_product['report_type'];
			$gstbook['year']=$fetch_product['year'];
			$gstbook['month']=$fetch_product['month'];
			$gstbook['report_url']="financial_GSTR_report/".$fetch_product['report_url'];
			$response['gstbook'][]=$gstbook;
		}
	}
	else
	{
		$response['gstbook']=$gstbook;
	}

	
	$query3 = mysqli_query($con,"select *  from tbl_distributor_financial_turbo_detail where distributor_id='$distid' and status='Accept' and financial_year like '%$search_year%'");
	$turbobook=array();
	if(mysqli_num_rows($query3)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query3))
		{
			$flagfinal=1;
			$turbobook['report_id']=$fetch_product['report_id'];
			$turbobook['invoice_period']=$fetch_product['invoice_period'];
			$turbobook['payout_ref_no']=$fetch_product['payout_ref_no'];
			$turbobook['filing_period']=$fetch_product['filing_period'];
			$turbobook['total_amount']=$fetch_product['total_amount'];
			$turbobook['gst_amount']=$fetch_product['gst_amount'];
			$response['turbobook'][]=$turbobook;
		}
	}
	else
	{
		$response['turbobook']=$turbobook;
	}
	$res4 = mysqli_query($con,"select *  from tbl_distributor_gst_certificate where distributor_id='$distid' and status='Accept'");
	$certificate=array();
	if(mysqli_num_rows($res4)>0)
	{
		while($fetch_product2=mysqli_fetch_assoc($res4))
		{
			$flagfinal=1;
			$certificate['detail_id']=$fetch_product2['detail_id'];
			$certificate['report_url']="distributor_certificate/".$fetch_product2['certificate_detail'];
			$response['certificate'][]=$certificate;
		}
	}
	else
	{
		$response['certificate']=$certificate;
	}
	if($flagfinal==1)
	{		
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Your Financial Report is not generated yet.";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>