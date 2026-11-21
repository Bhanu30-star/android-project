<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate']))
{
	$searchdate=$_POST['searchdate'];
	$ver=$_POST['distributor_id'];
	$res = mysqli_query($con,"select * from  tbl_digitally_invoice,tbl_distributor where tbl_digitally_invoice.AR_Code=tbl_distributor.oid and tbl_distributor.distributor_id='$ver' and tbl_digitally_invoice.Period like '".$searchdate."%' and tbl_digitally_invoice.Invoice_CN_status_by_Partner!='Pending for Acceptance'");
	$turbobook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$turbobook['invoice_id']=$fetch_product['invoice_id'];
			$turbobook['Period']=$fetch_product['Period'];
			$turbobook['Payout_Transaction_Reference_No']=$fetch_product['Payout_Transaction_Reference_No'];
			$turbobook['Invoice_Date']=$fetch_product['Invoice_Date'];
			$turbobook['Commission']=$fetch_product['Commission'];
			$turbobook['Total_CGST']=$fetch_product['Total_CGST'];
			$turbobook['Total_SGST']=$fetch_product['Total_SGST'];
			$turbobook['Total_IGST']=$fetch_product['Total_IGST'];
			$turbobook['Round_Off']=$fetch_product['Round_Off'];
			$turbobook['Grand_Total']=$fetch_product['Grand_Total'];
			$turbobook['Payout_Authorisation_Date']=$fetch_product['Payout_Authorisation_Date'];
			$turbobook['Invoice_Generation_Date']=$fetch_product['Invoice_Generation_Date'];
			$turbobook['Invoice_CN_status_by_Partner']=$fetch_product['Invoice_CN_status_by_Partner'];
			$turbobook['Invoice_acceptance_date_by_Partner']=$fetch_product['Invoice_acceptance_date_by_Partner'];
			$turbobook['company_status']=$fetch_product['company_status'];
			$turbobook['retailer_name']=$fetch_product['retailer_name'];
			$response['turbobook'][]=$turbobook;
			$response['success']='1';
			$response['details']="Fetch Detail Successful";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Turbo Invoice Detail Not Available!";	
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>